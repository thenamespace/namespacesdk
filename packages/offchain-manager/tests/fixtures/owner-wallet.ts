import { http, HttpResponse } from 'msw';
import { createWalletClient, custom } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import { parseSiweMessage } from 'viem/siwe';
import { server } from '../setup';

export const SEPOLIA_API = 'https://staging.offchain-manager.namespace.ninja';
export const MAINNET_API = 'https://offchain-manager.namespace.ninja';

/** A viem WalletClient with a throwaway key. Signing is local; any RPC call fails the test. */
export const createOwnerWallet = (chain: typeof mainnet | typeof sepolia = sepolia) =>
    createWalletClient({
        account: privateKeyToAccount(generatePrivateKey()),
        chain,
        transport: custom({
            request: async () => {
                throw new Error('Tests must not reach an RPC');
            },
        }),
    });

/** Decodes `siwe:<base64(utf8 message)>.<base64(utf8 signature)>` the way the API reads it. */
export const decodeAuthHeader = (header: string | null) => {
    if (!header?.startsWith('siwe:')) {
        throw new Error(`Not a SIWE auth header: ${header}`);
    }
    const parts = header.slice('siwe:'.length).split('.');
    if (parts.length !== 2) {
        throw new Error('A SIWE token has exactly two parts');
    }
    const message = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = Buffer.from(parts[1], 'base64').toString('utf8') as `0x${string}`;
    return { message, signature, fields: parseSiweMessage(message) };
};

/** Serves fresh nonces like `GET /api/v1/auth/nonce` (a bare string) and records them. */
export const mockNonces = (baseURL = SEPOLIA_API) => {
    const issued: string[] = [];
    server.use(
        http.get(`${baseURL}/api/v1/auth/nonce`, () => {
            const nonce = `nonce${issued.length}${'x'.repeat(20)}`;
            issued.push(nonce);
            return HttpResponse.text(nonce);
        }),
    );
    return issued;
};
