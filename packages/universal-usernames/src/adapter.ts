import { coinTypeForChain } from './coin-types';
import { isNormalizedUsername, normalizeUsername } from './normalize';
import { COIN_TYPE_KEY, hasOwnRecord, setRecord } from './records';
import type { UsernameProfileV1 } from './types';

export interface UsernameProfileInput {
  username: string;
  /** `null` and `undefined` values are left out, so nullable columns can be passed as they are. */
  texts?: Record<string, string | null | undefined>;
  /** Keys are chain names (`eth`, `btc`, `sol`, `base`, `evm`) or decimal coin types. */
  addresses?: Record<string, string | null | undefined>;
  contenthash?: string | null;
}

export interface UsernameHandlerOptions {
  /** When set, requests must send `Authorization: Bearer <bearerToken>`. */
  bearerToken?: string;
  /** Path the handler is mounted on, e.g. `/ens/users`. Defaults to the root. */
  basePath?: string;
}

/**
 * Builds a profile v1 object. Normalizes the username and turns chain-name
 * address keys into coin types. It does not validate record values, so one bad
 * record cannot break the whole response; use `validateUsernameProfile` or
 * the CLI to check them.
 *
 * @throws UsernameError for an invalid username.
 * @throws Error for an unknown chain name or two keys for the same coin type.
 */
export function defineUsernameProfile(input: UsernameProfileInput): UsernameProfileV1 {
  const profile: UsernameProfileV1 = {
    version: 1,
    username: normalizeUsername(input.username),
    texts: {},
    addresses: {},
  };

  for (const [key, value] of Object.entries(input.texts ?? {})) {
    if (value !== null && value !== undefined) setRecord(profile.texts, key, value);
  }
  for (const [key, value] of Object.entries(input.addresses ?? {})) {
    if (value === null || value === undefined) continue;
    const coinType = COIN_TYPE_KEY.test(key) ? key : String(coinTypeForChain(key));
    if (hasOwnRecord(profile.addresses, coinType)) {
      throw new Error(`Two address keys map to coin type ${coinType}`);
    }
    setRecord(profile.addresses, coinType, value);
  }
  if (input.contenthash !== null && input.contenthash !== undefined) {
    profile.contenthash = input.contenthash;
  }
  return profile;
}

const encoder = new TextEncoder();

/** Runs in time that depends only on the expected token's length. */
function tokensMatch(received: string, expected: string): boolean {
  const left = encoder.encode(received);
  const right = encoder.encode(expected);
  let diff = left.length ^ right.length;
  for (let i = 0; i < right.length; i++) {
    diff |= (left[i] | 0) ^ right[i];
  }
  return diff === 0;
}

function requestBearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? '';
  return header.slice(0, 7).toLowerCase() === 'bearer ' ? header.slice(7) : '';
}

function normalizeBasePath(basePath: string | undefined): string {
  const trimmed = (basePath ?? '').replace(/\/+$/, '');
  if (trimmed === '') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** The decoded single path segment after `basePath`, or null for any other path. */
function labelFromPath(pathname: string, basePath: string): string | null {
  const prefix = `${basePath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const segment = pathname.slice(prefix.length);
  if (segment.length === 0 || segment.includes('/')) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/**
 * Creates a Fetch API handler (`Request` in, `Response` out) that serves
 * `GET {basePath}/{username}` the way Namespace expects: `200` with the
 * profile, `404` when `lookup` returns null or the path is not a normalized
 * username, `401` when the bearer token is missing or wrong. Errors thrown by
 * `lookup` propagate to your framework.
 */
export function createUsernameHandler(
  lookup: (username: string) => Promise<UsernameProfileV1 | null>,
  options: UsernameHandlerOptions = {}
): (request: Request) => Promise<Response> {
  if (options.bearerToken === '') {
    throw new Error('bearerToken is empty; omit it to serve without authentication');
  }
  const expectedToken = options.bearerToken;
  const basePath = normalizeBasePath(options.basePath);

  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') {
      return jsonResponse(405, { error: 'method_not_allowed' }, { allow: 'GET' });
    }
    if (expectedToken !== undefined && !tokensMatch(requestBearerToken(request), expectedToken)) {
      return jsonResponse(401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
    }

    const label = labelFromPath(new URL(request.url).pathname, basePath);
    if (label === null || !isNormalizedUsername(label)) {
      return jsonResponse(404, { error: 'not_found' });
    }

    const profile = await lookup(label);
    if (profile === null) return jsonResponse(404, { error: 'not_found' });
    return jsonResponse(200, profile);
  };
}
