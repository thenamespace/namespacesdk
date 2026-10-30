export const PROFILE_SCHEMA_VERSION = 1;

/** Limits every Namespace component enforces on a brand endpoint response. */
export const PROFILE_LIMITS = {
  maxBytes: 262144,
  maxTexts: 128,
  maxAddresses: 128,
  maxTextKeyLength: 256,
  maxTextValueLength: 4096,
  maxAddressLength: 1024,
  maxContenthashLength: 4096,
} as const;

/**
 * JSON Schema (draft 2020-12) for profile v1. Frozen: change it only with a new
 * schema version. Duplicate keys, username matching and per-record encoding
 * rules are not expressible here; `parseUsernameProfile` enforces those.
 */
export const USERNAME_PROFILE_SCHEMA_V1: Record<string, unknown> = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Universal Usernames profile v1',
  type: 'object',
  additionalProperties: false,
  required: ['version', 'username', 'texts', 'addresses'],
  properties: {
    version: { const: 1 },
    username: { type: 'string', minLength: 1 },
    texts: {
      type: 'object',
      maxProperties: 128,
      propertyNames: { minLength: 1, maxLength: 256 },
      additionalProperties: { type: 'string', maxLength: 4096 },
    },
    addresses: {
      type: 'object',
      maxProperties: 128,
      propertyNames: { pattern: '^(0|[1-9][0-9]*)$' },
      additionalProperties: { type: 'string', minLength: 1, maxLength: 1024 },
    },
    contenthash: { type: 'string', minLength: 1, maxLength: 4096 },
  },
};
