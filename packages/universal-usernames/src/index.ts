export { PROFILE_LIMITS, PROFILE_SCHEMA_VERSION, USERNAME_PROFILE_SCHEMA_V1 } from './schema';
export type {
  EndpointValidationReport,
  EnvelopeIssueCode,
  HexString,
  ProfilePreview,
  RecordIssueCode,
  RecordResult,
  TransportIssueCode,
  UsernameProfileV1,
  ValidationIssue,
  ValidationIssueCode,
  ValidationIssueKind,
} from './types';

export { isNormalizedUsername, normalizeUsername, UsernameError } from './normalize';

export { parseUsernameProfile, validateUsernameProfile } from './parse-profile';
export type { ParsedUsernameProfile, ProfileParseOptions } from './parse-profile';

export { resolveAddress, resolveContenthash, resolveText } from './records';

export {
  coinTypeForChain,
  DEFAULT_EVM_COIN_TYPE,
  isEvmCoinType,
  isSupportedCoinType,
} from './coin-types';
export { SUPPORTED_CONTENTHASH_PROTOCOLS } from './contenthash';

export { buildProfileUrl, checkEndpointUrl } from './endpoint-url';
export type { EndpointUrlCheck } from './endpoint-url';

export { createUsernameHandler, defineUsernameProfile } from './adapter';
export type { UsernameHandlerOptions, UsernameProfileInput } from './adapter';
