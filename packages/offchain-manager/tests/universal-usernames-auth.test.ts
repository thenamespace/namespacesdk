import { http, HttpResponse } from 'msw';
import { namehash, verifyMessage } from 'viem';
import { mainnet } from 'viem/chains';
import { server } from './setup';
import {
    createOffchainClient,
    NamespaceSDKError,
    UniversalUsernamesError,
    ValidationError,
    WalletProvider,
} from '../src';
import { connection } from './fixtures/universal-usernames';
import {
    createOwnerWallet,
    decodeAuthHeader,
    MAINNET_API,
    mockNonces,
    SEPOLIA_API,
} from './fixtures/owner-wallet';

const TEN_MINUTES_MS = 10 * 60 * 1000;

// Answers a change and keeps the auth header it was sent with
const captureChange = (method: 'post' | 'put' | 'delete', path: string, baseURL = SEPOLIA_API) => {
    const seen: { authHeader: string | null }[] = [];
    server.use(
        http[method](`${baseURL}/api/v1/universal-usernames/${path}`, ({ request }) => {
            seen.push({ authHeader: request.headers.get('x-auth-token') });
            return HttpResponse.json(connection);
        }),
    );
    return seen;
};

const captureRead = (path: string) => {
    const seen: (string | null)[] = [];
    server.use(
        http.get(`${SEPOLIA_API}/api/v1/universal-usernames/${path}`, ({ request }) => {
            seen.push(request.headers.get('x-auth-token'));
            return HttpResponse.json(connection);
        }),
    );
    return seen;
};

describe('Universal Usernames owner auth', () => {
    describe('operation signatures', () => {
        it('signs an EIP-4361 message bound to the parent, action and revision with the server nonce', async () => {
            const wallet = createOwnerWallet();
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            const nonces = mockNonces();
            const seen = captureChange('put', 'brand.eth');

            const before = Date.now();
            await client.saveUsernameConnection('brand.eth', {
                endpointUrl: 'https://api.brand.example/ens/users',
                authMode: 'none',
                sampleUsername: 'happy',
                expectedRevision: 3,
            });

            const { message, signature, fields } = decodeAuthHeader(seen[0].authHeader);
            expect(fields.domain).toBe('staging.offchain-manager.namespace.ninja');
            expect(fields.uri).toBe('https://staging.offchain-manager.namespace.ninja');
            expect(fields.address).toBe(wallet.account.address);
            expect(fields.statement).toBe('Authorize save for Universal Usernames on brand.eth');
            expect(fields.version).toBe('1');
            expect(fields.chainId).toBe(11155111);
            expect(fields.nonce).toBe(nonces[0]);
            expect(fields.resources).toEqual([
                `urn:namespace:uun:${namehash('brand.eth')}:save:3`,
            ]);

            const issuedAt = fields.issuedAt!.getTime();
            const expiresAt = fields.expirationTime!.getTime();
            expect(issuedAt).toBeGreaterThanOrEqual(before - 1000);
            expect(issuedAt).toBeLessThanOrEqual(Date.now());
            expect(expiresAt).toBeGreaterThan(Date.now());
            expect(expiresAt - issuedAt).toBeLessThanOrEqual(TEN_MINUTES_MS);

            await expect(
                verifyMessage({ address: wallet.account.address, message, signature }),
            ).resolves.toBe(true);
        });

        it.each([
            ['activate', 'post', 'brand.eth/activate', (c: any) => c.activateUsernameConnection('brand.eth', { expectedRevision: 5 })],
            ['rotate-credential', 'post', 'brand.eth/credential', (c: any) => c.rotateUsernameCredential('brand.eth', { credential: 'new-token', expectedRevision: 5 })],
            ['pause', 'post', 'brand.eth/pause', (c: any) => c.pauseUsernameConnection('brand.eth', { expectedRevision: 5 })],
            ['resume', 'post', 'brand.eth/resume', (c: any) => c.resumeUsernameConnection('brand.eth', { expectedRevision: 5 })],
            ['disconnect', 'delete', 'brand.eth', (c: any) => c.disconnectUsernameConnection('brand.eth', { expectedRevision: 5 })],
        ] as const)('binds %s to its own action', async (action, method, path, call) => {
            const client = createOffchainClient({ mode: 'sepolia', provider: createOwnerWallet() });
            const nonces = mockNonces();
            const seen = captureChange(method, path);

            await call(client);

            const { fields } = decodeAuthHeader(seen[0].authHeader);
            expect(fields.statement).toBe(`Authorize ${action} for Universal Usernames on brand.eth`);
            expect(fields.resources).toEqual([`urn:namespace:uun:${namehash('brand.eth')}:${action}:5`]);
            expect(fields.nonce).toBe(nonces[0]);
        });

        it('fetches a new nonce and signs again for every change', async () => {
            const wallet = createOwnerWallet();
            const signMessage = jest.spyOn(wallet, 'signMessage');
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            const nonces = mockNonces();
            const seen = captureChange('post', 'brand.eth/pause');

            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 });
            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 2 });

            expect(signMessage).toHaveBeenCalledTimes(2);
            expect(seen.map((s) => decodeAuthHeader(s.authHeader).fields.nonce)).toEqual(nonces);
            expect(new Set(nonces).size).toBe(2);
        });

        it('uses chain 1 and the mainnet API host on mainnet', async () => {
            const client = createOffchainClient({ provider: createOwnerWallet(mainnet) });
            mockNonces(MAINNET_API);
            const seen = captureChange('post', 'brand.eth/activate', MAINNET_API);

            await client.activateUsernameConnection('brand.eth', { expectedRevision: 0 });

            const { fields } = decodeAuthHeader(seen[0].authHeader);
            expect(fields.chainId).toBe(1);
            expect(fields.domain).toBe('offchain-manager.namespace.ninja');
        });

        it('uses siweDomain and siweUri when set for a custom deployment', async () => {
            const client = createOffchainClient({
                mode: 'sepolia',
                provider: createOwnerWallet(),
                siweDomain: 'names.brand.example',
                siweUri: 'https://names.brand.example/login',
            });
            mockNonces();
            const seen = captureChange('post', 'brand.eth/resume');

            await client.resumeUsernameConnection('brand.eth', { expectedRevision: 2 });

            const { fields } = decodeAuthHeader(seen[0].authHeader);
            expect(fields.domain).toBe('names.brand.example');
            expect(fields.uri).toBe('https://names.brand.example/login');
        });

        it('encodes a Unicode parent name as UTF-8 so the statement survives', async () => {
            const wallet = createOwnerWallet();
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            mockNonces();
            const seen = captureChange('post', `${encodeURIComponent('🦊.eth')}/pause`);

            await client.pauseUsernameConnection('🦊.eth', { expectedRevision: 1 });

            const { message, signature, fields } = decodeAuthHeader(seen[0].authHeader);
            expect(fields.statement).toBe('Authorize pause for Universal Usernames on 🦊.eth');
            expect(fields.resources).toEqual([`urn:namespace:uun:${namehash('🦊.eth')}:pause:1`]);
            await expect(
                verifyMessage({ address: wallet.account.address, message, signature }),
            ).resolves.toBe(true);
        });

        it('keeps the nonce from the API as text even when it looks like a number', async () => {
            const client = createOffchainClient({ mode: 'sepolia', provider: createOwnerWallet() });
            server.use(
                http.get(`${SEPOLIA_API}/api/v1/auth/nonce`, () => HttpResponse.text('0012345678901234567890')),
            );
            const seen = captureChange('post', 'brand.eth/pause');

            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 });

            expect(decodeAuthHeader(seen[0].authHeader).fields.nonce).toBe('0012345678901234567890');
        });

        it('refuses a malformed nonce before asking the wallet to sign', async () => {
            const wallet = createOwnerWallet();
            const signMessage = jest.spyOn(wallet, 'signMessage');
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            server.use(
                http.get(`${SEPOLIA_API}/api/v1/auth/nonce`, () => HttpResponse.text('abc\nURI: evil')),
            );

            await expect(
                client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 }),
            ).rejects.toBeInstanceOf(UniversalUsernamesError);
            expect(signMessage).not.toHaveBeenCalled();
        });

        it.each([
            ['a negative revision', 'brand.eth', -1],
            ['a fractional revision', 'brand.eth', 1.5],
            ['an unnormalized parent name', 'Brand.eth', 1],
            ['an empty parent name', '', 1],
        ])('rejects %s before any request or signature', async (_case, parentName, expectedRevision) => {
            const wallet = createOwnerWallet();
            const signMessage = jest.spyOn(wallet, 'signMessage');
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });

            // No handlers: a request would fail with an msw error instead of ValidationError
            await expect(
                client.activateUsernameConnection(parentName, { expectedRevision }),
            ).rejects.toBeInstanceOf(ValidationError);
            expect(signMessage).not.toHaveBeenCalled();
        });
    });

    describe('sessions', () => {
        it('creates a session without a server nonce', async () => {
            const wallet = createOwnerWallet();
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });

            // No nonce handler: calling the nonce route would fail the test
            const session = await client.createUsernameOwnerSession({ expiresInSeconds: 600 });

            expect(session.address).toBe(wallet.account.address);
            const { message, signature, fields } = decodeAuthHeader(`siwe:${session.token}`);
            expect(fields.domain).toBe('staging.offchain-manager.namespace.ninja');
            expect(fields.chainId).toBe(11155111);
            expect(fields.nonce).toMatch(/^[a-zA-Z0-9]{8,}$/);
            expect(fields.resources).toBeUndefined();
            expect(fields.expirationTime!.getTime()).toBe(session.expiresAt);
            expect(session.expiresAt - fields.issuedAt!.getTime()).toBe(600 * 1000);
            await expect(
                verifyMessage({ address: wallet.account.address, message, signature }),
            ).resolves.toBe(true);
        });

        it('sends a passed session as the x-auth-token', async () => {
            const client = createOffchainClient({ mode: 'sepolia' });
            const session = await client.createUsernameOwnerSession({ wallet: createOwnerWallet() });
            const seen = captureRead('brand.eth');

            await client.getUsernameConnection('brand.eth', session);

            expect(seen).toEqual([`siwe:${session.token}`]);
        });

        it('signs one session for concurrent and repeated reads', async () => {
            const wallet = createOwnerWallet();
            const signMessage = jest.spyOn(wallet, 'signMessage');
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            const seen = captureRead('brand.eth');

            await Promise.all([
                client.getUsernameConnection('brand.eth'),
                client.getUsernameConnection('brand.eth'),
            ]);
            await client.getUsernameConnection('brand.eth');

            expect(signMessage).toHaveBeenCalledTimes(1);
            expect(new Set(seen).size).toBe(1);
        });

        it('signs a new session when the cached one is about to expire', async () => {
            const wallet = createOwnerWallet();
            const signMessage = jest.spyOn(wallet, 'signMessage');
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            const seen = captureRead('brand.eth');

            await client.getUsernameConnection('brand.eth');
            const { fields } = decodeAuthHeader(seen[0]);
            const now = jest.spyOn(Date, 'now').mockReturnValue(fields.expirationTime!.getTime() - 30 * 1000);
            try {
                await client.getUsernameConnection('brand.eth');
            } finally {
                now.mockRestore();
            }

            expect(signMessage).toHaveBeenCalledTimes(2);
            expect(seen[0]).not.toBe(seen[1]);
        });

        it('signs a new session when the wallet switches accounts', async () => {
            const first = createOwnerWallet();
            const second = createOwnerWallet();
            let active = first;
            const provider: WalletProvider = {
                getAddress: async () => active.account.address,
                signMessage: (message) => active.signMessage({ message }),
                getChainId: async () => 11155111,
            };
            const client = createOffchainClient({ mode: 'sepolia', provider });
            const seen = captureRead('brand.eth');

            await client.getUsernameConnection('brand.eth');
            active = second;
            await client.getUsernameConnection('brand.eth');

            expect(seen.map((h) => decodeAuthHeader(h).fields.address)).toEqual([
                first.account.address,
                second.account.address,
            ]);
        });

        it('asks again after a rejected sign-in', async () => {
            const wallet = createOwnerWallet();
            const signMessage = jest
                .spyOn(wallet, 'signMessage')
                .mockRejectedValueOnce(new Error('User rejected the request'));
            const client = createOffchainClient({ mode: 'sepolia', provider: wallet });
            captureRead('brand.eth');

            await expect(client.getUsernameConnection('brand.eth')).rejects.toThrow('User rejected the request');
            await expect(client.getUsernameConnection('brand.eth')).resolves.toEqual(connection);
            expect(signMessage).toHaveBeenCalledTimes(2);
        });
    });

    describe('wallets', () => {
        it('needs a wallet from the config or the call', async () => {
            const client = createOffchainClient({ mode: 'sepolia' });

            await expect(client.getUsernameConnection('brand.eth')).rejects.toBeInstanceOf(ValidationError);
            await expect(
                client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 }),
            ).rejects.toBeInstanceOf(ValidationError);
        });

        it('signs with a wallet passed to the call instead of the provider', async () => {
            const provider = createOwnerWallet();
            const other = createOwnerWallet();
            const client = createOffchainClient({ mode: 'sepolia', provider });
            mockNonces();
            const seen = captureChange('post', 'brand.eth/pause');

            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 }, other);

            expect(decodeAuthHeader(seen[0].authHeader).fields.address).toBe(other.account.address);
        });

        it('accepts an ethers-style signer', async () => {
            const viemWallet = createOwnerWallet();
            const ethersSigner = {
                getAddress: async () => viemWallet.account.address,
                signMessage: (message: string) => viemWallet.signMessage({ message }),
                provider: { getNetwork: async () => ({ chainId: BigInt(11155111) }) },
            };
            const client = createOffchainClient({ mode: 'sepolia', provider: ethersSigner });
            mockNonces();
            const seen = captureChange('post', 'brand.eth/pause');

            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 });

            const { message, signature } = decodeAuthHeader(seen[0].authHeader);
            await expect(
                verifyMessage({ address: viemWallet.account.address, message, signature }),
            ).resolves.toBe(true);
        });

        it('rejects an unsupported wallet', async () => {
            const client = createOffchainClient({ mode: 'sepolia', provider: { foo: 'bar' } });

            await expect(
                client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 }),
            ).rejects.toMatchObject({ code: 'UNSUPPORTED_WALLET' });
        });

        it('refuses to sign on another chain when the wallet cannot switch', async () => {
            const viemWallet = createOwnerWallet(mainnet);
            const signMessage = jest.fn((message: string) => viemWallet.signMessage({ message }));
            const provider: WalletProvider = {
                getAddress: async () => viemWallet.account.address,
                signMessage,
                getChainId: async () => 1,
            };
            const client = createOffchainClient({ mode: 'sepolia', provider });

            const error = await client
                .pauseUsernameConnection('brand.eth', { expectedRevision: 1 })
                .catch((err) => err);

            expect(error).toBeInstanceOf(NamespaceSDKError);
            expect(error.code).toBe('WALLET_CHAIN_MISMATCH');
            expect(signMessage).not.toHaveBeenCalled();
        });

        it('switches the wallet to the deployment chain when it can', async () => {
            const viemWallet = createOwnerWallet();
            let chainId = 1;
            const provider: WalletProvider = {
                getAddress: async () => viemWallet.account.address,
                signMessage: (message) => viemWallet.signMessage({ message }),
                getChainId: async () => chainId,
                switchChain: async (id) => {
                    chainId = id;
                },
            };
            const client = createOffchainClient({ mode: 'sepolia', provider });
            mockNonces();
            const seen = captureChange('post', 'brand.eth/pause');

            await client.pauseUsernameConnection('brand.eth', { expectedRevision: 1 });

            expect(chainId).toBe(11155111);
            expect(decodeAuthHeader(seen[0].authHeader).fields.chainId).toBe(11155111);
        });
    });
});
