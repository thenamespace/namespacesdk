import { inspect } from 'util';
import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { server } from './setup';
import {
    ChainName,
    ConnectionRevisionConflictError,
    createOffchainClient,
    EndpointValidationError,
    NamespaceSDKError,
    NotParentOwnerError,
    OffchainClient,
    UniversalUsernamesError,
    UsernameConnection,
    UsernameConnectionEvent,
    UsernameConnectionRevision,
    UsernameOwnerSession,
    UsernameValidationReport,
} from '../src';
import { connection, events, inspection, validationReport } from './fixtures/universal-usernames';
import { createOwnerWallet, decodeAuthHeader, mockNonces, SEPOLIA_API } from './fixtures/owner-wallet';

const API = `${SEPOLIA_API}/api/v1/universal-usernames`;
const CREDENTIAL = 'brand-endpoint-secret-7f3a';

// Compile-time guard, checked by `tsc -p tsconfig.test.json`: response types carry no credential field
type HasCredentialField<T> = 'credential' extends keyof T ? true : false;
const responseTypesHaveNoCredential: [
    HasCredentialField<UsernameConnection>,
    HasCredentialField<UsernameConnectionRevision>,
    HasCredentialField<UsernameValidationReport>,
    HasCredentialField<UsernameConnectionEvent>,
] = [false, false, false, false];

interface SeenRequest {
    method: string;
    url: URL;
    authHeader: string | null;
    body: unknown;
}

// Answers every Universal Usernames route with `respond` and records what was sent
const recordRequests = (respond: (request: Request) => Response | Promise<Response>) => {
    const seen: SeenRequest[] = [];
    server.use(
        http.all(`${API}/*`, async ({ request }) => {
            const text = await request.clone().text();
            seen.push({
                method: request.method,
                url: new URL(request.url),
                authHeader: request.headers.get('x-auth-token'),
                body: text ? JSON.parse(text) : undefined,
            });
            return respond(request);
        }),
    );
    return seen;
};

const apiError = (status: number, body: Record<string, unknown>) => () =>
    HttpResponse.json(body, { status });

// Every key anywhere in a JSON value
const keysOf = (value: unknown): string[] =>
    value && typeof value === 'object'
        ? Object.entries(value).flatMap(([key, child]) => [key, ...keysOf(child)])
        : [];

describe('Universal Usernames methods', () => {
    let client: OffchainClient;
    let session: UsernameOwnerSession;

    beforeEach(async () => {
        client = createOffchainClient({ mode: 'sepolia', provider: createOwnerWallet() });
        session = await client.createUsernameOwnerSession();
    });

    describe('reads with the owner session', () => {
        it.each([
            ['getUsernameConnection', 'GET', '/brand.eth', undefined, connection, (c: OffchainClient, s: UsernameOwnerSession) => c.getUsernameConnection('brand.eth', s)],
            ['inspectUsernameParent', 'GET', '/brand.eth/inspection', undefined, inspection, (c: OffchainClient, s: UsernameOwnerSession) => c.inspectUsernameParent('brand.eth', s)],
            ['getUsernameConnectionEvents', 'GET', '/brand.eth/events', undefined, events, (c: OffchainClient, s: UsernameOwnerSession) => c.getUsernameConnectionEvents('brand.eth', s)],
            ['previewUsername', 'POST', '/brand.eth/preview', { username: 'happy' }, validationReport, (c: OffchainClient, s: UsernameOwnerSession) => c.previewUsername('brand.eth', 'happy', s)],
            [
                'validateUsernameEndpoint',
                'POST',
                '/brand.eth/validate',
                { endpointUrl: 'https://api.brand.example/ens/users', authMode: 'bearer', credential: CREDENTIAL, username: 'happy' },
                validationReport,
                (c: OffchainClient, s: UsernameOwnerSession) =>
                    c.validateUsernameEndpoint(
                        'brand.eth',
                        { endpointUrl: 'https://api.brand.example/ens/users', authMode: 'bearer', credential: CREDENTIAL, username: 'happy' },
                        s,
                    ),
            ],
        ] as const)('%s sends %s %s', async (_name, method, path, body, response, call) => {
            const seen = recordRequests(() => HttpResponse.json(response));

            await expect(call(client, session)).resolves.toEqual(response);

            expect(seen).toHaveLength(1);
            expect(seen[0].method).toBe(method);
            expect(seen[0].url.pathname).toBe(`/api/v1/universal-usernames${path}`);
            expect(seen[0].authHeader).toBe(`siwe:${session.token}`);
            expect(seen[0].body).toEqual(body);
        });

        it('URL-encodes the parent name', async () => {
            const seen = recordRequests(() => HttpResponse.json(connection));

            await client.getUsernameConnection('🦊.eth', session);

            expect(seen[0].url.pathname).toBe(`/api/v1/universal-usernames/${encodeURIComponent('🦊.eth')}`);
        });

        it('returns null when the parent has no connection', async () => {
            recordRequests(apiError(404, { code: 'CONNECTION_NOT_FOUND', message: 'No connection for brand.eth' }));

            await expect(client.getUsernameConnection('brand.eth', session)).resolves.toBeNull();
        });

        it('still throws a 404 that is not CONNECTION_NOT_FOUND, such as the feature being off', async () => {
            recordRequests(apiError(404, { statusCode: 404, message: 'Not Found' }));

            const error = await client.getUsernameConnection('brand.eth', session).catch((err) => err);

            expect(error).toBeInstanceOf(UniversalUsernamesError);
            expect(error.status).toBe(404);
            expect(error.code).toBeUndefined();
        });

        it('never sends an API key, even when one is configured', async () => {
            const keyed = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'api-key-value',
                customHeaders: { 'x-auth-token': 'header-api-key' },
            });
            const seen = recordRequests(() => HttpResponse.json(connection));

            await keyed.getUsernameConnection('brand.eth', session);

            expect(seen[0].authHeader).toBe(`siwe:${session.token}`);
        });
    });

    describe('changes signed by the owner', () => {
        beforeEach(() => {
            mockNonces();
        });

        it.each([
            [
                'saveUsernameConnection',
                'PUT',
                '/brand.eth',
                {
                    endpointUrl: 'https://api.brand.example/ens/users',
                    authMode: 'bearer',
                    credential: CREDENTIAL,
                    sampleUsername: 'happy',
                    acknowledgeStoredSubnames: true,
                    expectedRevision: 4,
                },
                (c: OffchainClient) =>
                    c.saveUsernameConnection('brand.eth', {
                        endpointUrl: 'https://api.brand.example/ens/users',
                        authMode: 'bearer',
                        credential: CREDENTIAL,
                        sampleUsername: 'happy',
                        acknowledgeStoredSubnames: true,
                        expectedRevision: 4,
                    }),
            ],
            ['activateUsernameConnection', 'POST', '/brand.eth/activate', { expectedRevision: 4 }, (c: OffchainClient) => c.activateUsernameConnection('brand.eth', { expectedRevision: 4 })],
            [
                'rotateUsernameCredential',
                'POST',
                '/brand.eth/credential',
                { credential: CREDENTIAL, expectedRevision: 4 },
                (c: OffchainClient) => c.rotateUsernameCredential('brand.eth', { credential: CREDENTIAL, expectedRevision: 4 }),
            ],
            ['pauseUsernameConnection', 'POST', '/brand.eth/pause', { expectedRevision: 4 }, (c: OffchainClient) => c.pauseUsernameConnection('brand.eth', { expectedRevision: 4 })],
            ['resumeUsernameConnection', 'POST', '/brand.eth/resume', { expectedRevision: 4 }, (c: OffchainClient) => c.resumeUsernameConnection('brand.eth', { expectedRevision: 4 })],
        ] as const)('%s sends %s %s with an operation signature', async (_name, method, path, body, call) => {
            const seen = recordRequests(() => HttpResponse.json(connection));

            await expect(call(client)).resolves.toEqual(connection);

            expect(seen).toHaveLength(1);
            expect(seen[0].method).toBe(method);
            expect(seen[0].url.pathname).toBe(`/api/v1/universal-usernames${path}`);
            expect(seen[0].body).toEqual(body);
            // An operation signature, not the session
            expect(seen[0].authHeader).not.toBe(`siwe:${session.token}`);
            expect(decodeAuthHeader(seen[0].authHeader).fields.resources?.[0]).toMatch(/:4$/);
        });

        it('disconnectUsernameConnection sends DELETE with expectedRevision in the query', async () => {
            const disconnected = { ...connection, status: 'disconnected' as const };
            const seen = recordRequests(() => HttpResponse.json(disconnected));

            await expect(
                client.disconnectUsernameConnection('brand.eth', { expectedRevision: 4 }),
            ).resolves.toEqual(disconnected);

            expect(seen[0].method).toBe('DELETE');
            expect(seen[0].url.pathname).toBe('/api/v1/universal-usernames/brand.eth');
            expect(seen[0].url.searchParams.get('expectedRevision')).toBe('4');
            expect(seen[0].body).toBeUndefined();
            expect(decodeAuthHeader(seen[0].authHeader).fields.resources?.[0]).toMatch(/:disconnect:4$/);
        });
    });

    describe('errors', () => {
        beforeEach(() => {
            mockNonces();
        });

        it('maps 403 NOT_PARENT_OWNER to NotParentOwnerError', async () => {
            recordRequests(apiError(403, { code: 'NOT_PARENT_OWNER', message: 'Only the parent owner can do this' }));

            const error = await client.inspectUsernameParent('brand.eth', session).catch((err) => err);

            expect(error).toBeInstanceOf(NotParentOwnerError);
            expect(error).toBeInstanceOf(UniversalUsernamesError);
            expect(error).toBeInstanceOf(NamespaceSDKError);
            expect(error).toMatchObject({ status: 403, code: 'NOT_PARENT_OWNER', message: 'Only the parent owner can do this' });
        });

        it('maps 409 REVISION_CONFLICT to ConnectionRevisionConflictError', async () => {
            recordRequests(apiError(409, { code: 'REVISION_CONFLICT', message: 'Expected revision 3, the connection is at 4' }));

            const error = await client.pauseUsernameConnection('brand.eth', { expectedRevision: 3 }).catch((err) => err);

            expect(error).toBeInstanceOf(ConnectionRevisionConflictError);
            expect(error).toMatchObject({ status: 409, code: 'REVISION_CONFLICT', retryable: false });
        });

        it('keeps other 409 codes on the generic error', async () => {
            recordRequests(apiError(409, { code: 'INVALID_STATE', message: 'Cannot pause while draft' }));

            const error = await client.pauseUsernameConnection('brand.eth', { expectedRevision: 4 }).catch((err) => err);

            expect(error).toBeInstanceOf(UniversalUsernamesError);
            expect(error).not.toBeInstanceOf(ConnectionRevisionConflictError);
            expect(error).toMatchObject({ status: 409, code: 'INVALID_STATE' });
        });

        it('maps 422 VALIDATION_FAILED to EndpointValidationError', async () => {
            recordRequests(apiError(422, { code: 'VALIDATION_FAILED', message: 'Username must be a single normalized ENS label' }));

            const error = await client.previewUsername('brand.eth', 'a.b', session).catch((err) => err);

            expect(error).toBeInstanceOf(EndpointValidationError);
            expect(error).toMatchObject({ status: 422, code: 'VALIDATION_FAILED', report: null });
        });

        it('keeps the validation report a 422 carries', async () => {
            const failed = { ...validationReport, ok: false, issues: [{ code: 'HTTP_TIMEOUT', kind: 'transport', path: '', message: 'Timed out' }] };
            recordRequests(apiError(422, { code: 'VALIDATION_FAILED', message: 'The sample username no longer validates', details: failed }));

            const error = await client.resumeUsernameConnection('brand.eth', { expectedRevision: 4 }).catch((err) => err);

            expect(error).toBeInstanceOf(EndpointValidationError);
            expect(error.report).toEqual(failed);
        });

        it('returns CONNECTION_NOT_FOUND from a change as a generic 404 error', async () => {
            recordRequests(apiError(404, { code: 'CONNECTION_NOT_FOUND', message: 'No connection for brand.eth' }));

            const error = await client.activateUsernameConnection('brand.eth', { expectedRevision: 0 }).catch((err) => err);

            expect(error).toBeInstanceOf(UniversalUsernamesError);
            expect(error).toMatchObject({ status: 404, code: 'CONNECTION_NOT_FOUND' });
        });

        it('passes 412 details through', async () => {
            const blockers = [{ code: 'RESOLVER_NOT_HYBRID', message: 'Set the resolver first' }];
            recordRequests(apiError(412, { code: 'PRECONDITION_FAILED', message: 'The parent is not ready', details: blockers }));

            const error = await client.activateUsernameConnection('brand.eth', { expectedRevision: 4 }).catch((err) => err);

            expect(error).toMatchObject({ status: 412, code: 'PRECONDITION_FAILED', details: blockers });
        });

        it.each([
            [503, 'UPSTREAM_UNAVAILABLE', true],
            [429, 'RATE_LIMITED', true],
            [401, 'INVALID_OPERATION_SIGNATURE', false],
        ])('marks %s %s retryable: %s', async (status, code, retryable) => {
            recordRequests(apiError(status, { code, message: 'Try again shortly' }));

            const error = await client.saveUsernameConnection('brand.eth', {
                endpointUrl: 'https://api.brand.example/ens/users',
                authMode: 'none',
                sampleUsername: 'happy',
                expectedRevision: 4,
            }).catch((err) => err);

            expect(error).toBeInstanceOf(UniversalUsernamesError);
            expect(error).toMatchObject({ status, code, retryable });
        });

        it('joins the messages of a rejected request body', async () => {
            recordRequests(apiError(400, { statusCode: 400, message: ['endpointUrl must be a string', 'username should not be empty'], error: 'Bad Request' }));

            const error = await client.validateUsernameEndpoint('brand.eth', { endpointUrl: '', authMode: 'none', username: '' }, session).catch((err) => err);

            expect(error).toMatchObject({ status: 400, code: undefined });
            expect(error.message).toBe('endpointUrl must be a string; username should not be empty');
        });

        it('keeps the existing subname methods on their current errors', async () => {
            const keyed = createOffchainClient({ mode: 'sepolia', defaultApiKey: 'api-key-value' });
            server.use(
                http.post(`${SEPOLIA_API}/api/v1/subnames`, apiError(409, { code: 'REVISION_CONFLICT', message: 'Subname exists' })),
            );

            const error = await keyed
                .createSubname({ parentName: 'brand.eth', label: 'alice', addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }] })
                .catch((err) => err);

            expect(error).toBeInstanceOf(AxiosError);
            expect(error).not.toBeInstanceOf(UniversalUsernamesError);
        });
    });

    describe('credentials and tokens', () => {
        beforeEach(() => {
            mockNonces();
        });

        it.each([
            ['an API error', () => apiError(500, { code: 'INTERNAL', message: 'Something broke' })()],
            ['a network failure', () => HttpResponse.error()],
        ])('leaves the credential and auth token out of %s', async (_case, respond) => {
            const seen = recordRequests(respond);

            const error = await client.saveUsernameConnection('brand.eth', {
                endpointUrl: 'https://api.brand.example/ens/users',
                authMode: 'bearer',
                credential: CREDENTIAL,
                sampleUsername: 'happy',
                expectedRevision: 4,
            }).catch((err) => err);

            expect(error).toBeInstanceOf(UniversalUsernamesError);
            const printed = inspect(error, { depth: 10, showHidden: true });
            const token = seen[0].authHeader!.slice('siwe:'.length);
            expect(printed).not.toContain(CREDENTIAL);
            expect(printed).not.toContain(token.split('.')[0]);
            expect(printed).not.toContain(token.split('.')[1]);
            expect(error.cause).toBeUndefined();
        });

        it('returns no credential from any response', async () => {
            const responses: Record<string, Parameters<typeof HttpResponse.json>[0]> = {
                '/brand.eth': connection,
                '/brand.eth/inspection': inspection,
                '/brand.eth/events': events,
                '/brand.eth/validate': validationReport,
            };
            recordRequests((request) => {
                const path = new URL(request.url).pathname.replace('/api/v1/universal-usernames', '');
                return HttpResponse.json(responses[path]);
            });

            const results = [
                await client.getUsernameConnection('brand.eth', session),
                await client.inspectUsernameParent('brand.eth', session),
                await client.getUsernameConnectionEvents('brand.eth', session),
                await client.validateUsernameEndpoint(
                    'brand.eth',
                    { endpointUrl: 'https://api.brand.example/ens/users', authMode: 'bearer', credential: CREDENTIAL, username: 'happy' },
                    session,
                ),
                await client.saveUsernameConnection('brand.eth', {
                    endpointUrl: 'https://api.brand.example/ens/users',
                    authMode: 'bearer',
                    credential: CREDENTIAL,
                    sampleUsername: 'happy',
                    expectedRevision: 4,
                }),
            ];

            for (const result of results) {
                expect(keysOf(result)).not.toContain('credential');
                expect(JSON.stringify(result)).not.toContain(CREDENTIAL);
            }
            expect(responseTypesHaveNoCredential).toEqual([false, false, false, false]);
        });
    });
});
