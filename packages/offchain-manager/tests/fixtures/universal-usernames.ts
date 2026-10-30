import type {
    ParentInspection,
    UsernameConnection,
    UsernameConnectionEvent,
    UsernameConnectionRevision,
    UsernameValidationReport,
} from '../../src';

export const PARENT_NAME = 'brand.eth';
export const PARENT_NODE = '0x0000000000000000000000000000000000000000000000000000000000000001';
export const OWNER = '0x1111111111111111111111111111111111111111';

export const validationReport: UsernameValidationReport = {
    ok: true,
    checkedAt: '2026-10-30T12:00:00.000Z',
    username: 'happy',
    requestUrl: 'https://api.brand.example/ens/users/happy',
    httpStatus: 200,
    latencyMs: 42,
    issues: [],
    preview: {
        texts: { name: 'Happy' },
        addresses: { '60': '0x2222222222222222222222222222222222222222' },
        contenthash: null,
    },
    onchainConflict: false,
};

export const revision: UsernameConnectionRevision = {
    revisionNo: 1,
    endpointUrl: 'https://api.brand.example/ens/users',
    authMode: 'bearer',
    hasCredential: true,
    credentialUpdatedAt: '2026-10-30T12:00:00.000Z',
    sampleUsername: 'happy',
    state: 'validated',
    validation: validationReport,
    createdAt: '2026-10-30T12:00:00.000Z',
    createdBy: OWNER,
};

export const connection: UsernameConnection = {
    parentName: PARENT_NAME,
    parentNode: PARENT_NODE,
    chain: 'sepolia',
    status: 'validated',
    revision: 4,
    activeRevision: null,
    latestRevision: revision,
    owner: { address: OWNER, source: 'v1', checkedAt: '2026-10-30T12:00:00.000Z' },
    storedSubnamesAcknowledged: false,
    suspendedReason: null,
    activation: null,
    createdAt: '2026-10-30T12:00:00.000Z',
    updatedAt: '2026-10-30T12:00:00.000Z',
};

export const inspection: ParentInspection = {
    parentName: PARENT_NAME,
    parentNode: PARENT_NODE,
    supported: true,
    owner: { address: OWNER, source: 'v1', expiresAt: '2027-10-30T12:00:00.000Z' },
    resolver: { address: null, isHybridResolverV2: false },
    route: { id: null, isOffchain: false },
    canSetResolver: true,
    storedSubnames: { count: 0 },
    blockers: [],
};

export const events: UsernameConnectionEvent[] = [
    {
        action: 'save',
        actor: OWNER,
        revisionNo: 1,
        createdAt: '2026-10-30T12:00:00.000Z',
        details: { authMode: 'bearer', hasCredential: true },
    },
];
