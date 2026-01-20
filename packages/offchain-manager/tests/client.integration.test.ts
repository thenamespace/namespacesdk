import { http, HttpResponse } from 'msw';
import { server } from './setup';
import { createOffchainClient, ChainName } from '../src';

describe('OffchainClient Integration Tests', () => {
    let client: any;
    const baseURL = 'https://staging.offchain-manager.namespace.ninja'; // Sepolia endpoint

    describe('Client Initialization', () => {
        it('should initialize with no arguments (defaults to mainnet)', () => {
            const client = createOffchainClient();
            expect(client).toBeDefined();
        });

        it('should initialize with default API key in config', () => {
            const client = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'test-default-key'
            });
            expect(client).toBeDefined();
        });

        it('should initialize with domain API keys in config', () => {
            const client = createOffchainClient({
                mode: 'sepolia',
                domainApiKeys: {
                    'example.eth': 'domain-key-1',
                    'test.eth': 'domain-key-2'
                }
            });
            expect(client).toBeDefined();
        });

        it('should initialize with both default and domain API keys', () => {
            const client = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'test-default-key',
                domainApiKeys: {
                    'example.eth': 'domain-key-1'
                }
            });
            expect(client).toBeDefined();
        });
    });

    beforeEach(() => {
        client = createOffchainClient({ mode: 'sepolia' });
        client.setDefaultApiKey('test-api-key');
    });

    describe('API Key Management', () => {
        it('should use default API key from config when no specific key is set', async () => {
            const clientWithDefaultKey = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'config-default-key'
            });

            // Setup MSW handler for createSubname
            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    // Verify the request has the correct auth header
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('config-default-key');

                    // Verify the request body
                    const body = await request.json() as any;
                    expect(body).toEqual({
                        parentName: 'example.eth',
                        label: 'test',
                        addresses: [{ coin: 60, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
                        texts: undefined,
                        metadata: undefined,
                        contenthash: undefined,
                        ttl: undefined
                    });

                    return HttpResponse.json({ success: true });
                })
            );

            await clientWithDefaultKey.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }]
            });
        });

        it('should use domain API key from config when available', async () => {
            const clientWithDomainKeys = createOffchainClient({
                mode: 'sepolia',
                domainApiKeys: {
                    'example.eth': 'config-domain-key'
                }
            });

            // Setup MSW handler for createSubname
            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    // Verify the request has the correct auth header
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('config-domain-key');

                    // Verify the request body
                    const body = await request.json() as any;
                    expect(body).toEqual({
                        parentName: 'example.eth',
                        label: 'test',
                        addresses: [{ coin: 60, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
                        texts: undefined,
                        metadata: undefined,
                        contenthash: undefined,
                        ttl: undefined
                    });

                    return HttpResponse.json({ success: true });
                })
            );

            await clientWithDomainKeys.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }]
            });
        });

        it('should use default API key when no specific key is set', async () => {
            // Setup MSW handler for createSubname
            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    // Verify the request has the correct auth header
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('test-api-key');

                    // Verify the request body
                    const body = await request.json() as any;
                    expect(body).toEqual({
                        parentName: 'example.eth',
                        label: 'test',
                        addresses: [{ coin: 60, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
                        texts: undefined,
                        metadata: undefined,
                        contenthash: undefined,
                        ttl: undefined
                    });

                    return HttpResponse.json({ success: true });
                })
            );

            await client.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }]
            });
        });

        it('should use specific API key when set', async () => {
            client.setApiKey('example.eth', 'specific-key');

            // Setup MSW handler for createSubname
            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    // Verify the request has the correct auth header
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('specific-key');

                    // Verify the request body
                    const body = await request.json() as any;
                    expect(body).toEqual({
                        parentName: 'example.eth',
                        label: 'test',
                        addresses: [{ coin: 60, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
                        texts: undefined,
                        metadata: undefined,
                        contenthash: undefined,
                        ttl: undefined
                    });

                    return HttpResponse.json({ success: true });
                })
            );

            await client.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }]
            });
        });

        it('should send custom headers provided in config with authenticated requests', async () => {
            const clientWithHeaders = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'config-default-key',
                customHeaders: {
                    'x-custom-header': 'from-config',
                },
            });

            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('config-default-key');

                    const custom = request.headers.get('x-custom-header');
                    expect(custom).toBe('from-config');

                    return HttpResponse.json({ success: true });
                }),
            );

            await clientWithHeaders.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
            });
        });

        it('should send custom headers set via setCustomHeaders with authenticated requests', async () => {
            const clientWithHeaders = createOffchainClient({
                mode: 'sepolia',
                defaultApiKey: 'config-default-key',
            });

            clientWithHeaders.setCustomHeaders({
                'x-custom-header': 'from-setter',
            });

            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('config-default-key');

                    const custom = request.headers.get('x-custom-header');
                    expect(custom).toBe('from-setter');

                    return HttpResponse.json({ success: true });
                }),
            );

            await clientWithHeaders.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
            });
        });
    });

    describe('Subname Operations', () => {
        it('should create a subname successfully', async () => {
            // Setup MSW handler for createSubname
            server.use(
                http.post(`${baseURL}/api/v1/subnames`, async ({ request }) => {
                    // Verify the request has the correct auth header
                    const authToken = request.headers.get('x-auth-token');
                    expect(authToken).toBe('test-api-key');

                    // Verify the request body
                    const body = await request.json() as any;
                    expect(body).toEqual({
                        parentName: 'example.eth',
                        label: 'test',
                        addresses: [{ coin: 60, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }],
                        texts: undefined,
                        metadata: undefined,
                        contenthash: undefined,
                        ttl: undefined
                    });

                    return HttpResponse.json({ success: true });
                })
            );

            await client.createSubname({
                parentName: 'example.eth',
                label: 'test',
                addresses: [{ chain: ChainName.Ethereum, value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }]
            });
        });

        it('should check subname availability correctly', async () => {
            // Setup MSW handlers for availability checks
            server.use(
                // Test available subname (404 response)
                http.get(`${baseURL}/api/v1/subnames/available.example.eth`, () => {
                    return new HttpResponse(null, { status: 404 });
                }),
                // Test unavailable subname (200 response with data)
                http.get(`${baseURL}/api/v1/subnames/taken.example.eth`, () => {
                    return HttpResponse.json({ id: '123', fullName: 'taken.example.eth' });
                })
            );

            // Test available subname
            const available = await client.isSubnameAvailable('available.example.eth');
            expect(available.isAvailable).toBe(true);

            // Test unavailable subname
            const unavailable = await client.isSubnameAvailable('taken.example.eth');
            expect(unavailable.isAvailable).toBe(false);
        });

        it('should get subname details', async () => {
            const mockSubname = {
                id: '123',
                fullName: 'test.example.eth',
                parentName: 'example.eth',
                label: 'test',
                texts: { twitter: '@test' },
                addresses: { '60': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
                metadata: {},
                namehash: '0x123...',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
            };

            // Setup MSW handler for getting subname details
            server.use(
                http.get(`${baseURL}/api/v1/subnames/test.example.eth`, () => {
                    return HttpResponse.json(mockSubname);
                })
            );

            const result = await client.getSingleSubname('test.example.eth');
            expect(result).toEqual(mockSubname);
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors', async () => {
            // Setup MSW handler for 401 error
            server.use(
                http.get(`${baseURL}/api/v1/subnames/test.example.eth`, () => {
                    return HttpResponse.json(
                        { error: 'Unauthorized' },
                        { status: 401 }
                    );
                })
            );

            await expect(client.getSingleSubname('test.example.eth'))
                .rejects.toThrow();
        });

        it('should handle rate limiting', async () => {
            // Setup MSW handler for 429 error
            server.use(
                http.get(`${baseURL}/api/v1/subnames/test.example.eth`, () => {
                    return HttpResponse.json(
                        { error: 'Rate limit exceeded' },
                        { status: 429 }
                    );
                })
            );

            await expect(client.getSingleSubname('test.example.eth'))
                .rejects.toThrow();
        });
    });
}); 