// Imports go through ./index so the CLI bundle reuses dist/index.js (see scripts/bundle.mjs).
import {
  buildProfileUrl,
  checkEndpointUrl,
  normalizeUsername,
  PROFILE_LIMITS,
  validateUsernameProfile,
} from './index';
import type { EndpointValidationReport, TransportIssueCode, ValidationIssue } from './index';

const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT = 'Namespace-UniversalUsernames/1';

export interface EndpointCheckOptions {
  endpointUrl: string;
  username: string;
  bearerToken?: string;
  /** Allows `http:` endpoints. For local tests only. */
  allowInsecure?: boolean;
  timeoutMs?: number;
}

function transportIssue(code: TransportIssueCode, message: string): ValidationIssue {
  return { code, kind: 'transport', path: '', message };
}

function issueForStatus(status: number): ValidationIssue | null {
  if (status >= 200 && status < 300) return null;
  if (status >= 300 && status < 400) {
    return transportIssue('HTTP_REDIRECT', `Endpoint answered ${status}; redirects are never followed`);
  }
  if (status === 404) {
    return transportIssue('USERNAME_NOT_FOUND', 'Endpoint answered 404; the sample username must exist');
  }
  if (status === 401 || status === 403) {
    return transportIssue('UNAUTHORIZED', `Endpoint answered ${status}; check the bearer token`);
  }
  if (status === 429) return transportIssue('RATE_LIMITED', 'Endpoint answered 429');
  return transportIssue('HTTP_ERROR_STATUS', `Endpoint answered ${status}`);
}

function isJsonContentType(header: string | null): boolean {
  return (header ?? '').split(';')[0].trim().toLowerCase() === 'application/json';
}

/** Reads at most `maxBytes` (after decompression). Returns null when the body is larger. */
async function readBody(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  if (!response.body) return new Uint8Array(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * Fetches `{endpointUrl}/{username}` the way Namespace does (same headers,
 * 5 s deadline, 256 KiB limit, no redirects) and validates the answer.
 *
 * @throws UsernameError when `username` is not a valid single ENS label.
 */
export async function checkEndpoint(options: EndpointCheckOptions): Promise<EndpointValidationReport> {
  const checkedAt = new Date().toISOString();
  const username = normalizeUsername(options.username);
  const report = ({
    requestUrl,
    issues,
    httpStatus = null,
    latencyMs = null,
    preview = null,
  }: Pick<EndpointValidationReport, 'requestUrl' | 'issues'> &
    Partial<EndpointValidationReport>): EndpointValidationReport => ({
    ok: issues.length === 0,
    checkedAt,
    username,
    requestUrl,
    httpStatus,
    latencyMs,
    issues,
    preview,
  });

  const url = checkEndpointUrl(options.endpointUrl, { allowInsecure: options.allowInsecure });
  // The rejected URL may carry credentials, so it is not echoed back.
  if (!url.ok) return report({ requestUrl: '', issues: [url.issue] });
  const requestUrl = buildProfileUrl(url.url, username);

  const headers: Record<string, string> = { accept: 'application/json', 'user-agent': USER_AGENT };
  if (options.bearerToken) headers.authorization = `Bearer ${options.bearerToken}`;

  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const requestFailed = (err: unknown, httpStatus: number | null): EndpointValidationReport => {
    // fetch() rejects with a generic "fetch failed"; the cause names the real problem.
    const reason = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
    const issue = controller.signal.aborted
      ? transportIssue('HTTP_TIMEOUT', `No complete answer within ${timeoutMs} ms`)
      : transportIssue('NETWORK_ERROR', `Request failed: ${reason}`);
    return report({ requestUrl, httpStatus, latencyMs: Date.now() - startedAt, issues: [issue] });
  };

  try {
    let response: Response;
    try {
      response = await fetch(requestUrl, { headers, redirect: 'manual', signal: controller.signal });
    } catch (err) {
      return requestFailed(err, null);
    }
    const httpStatus = response.status;

    const statusIssue = issueForStatus(httpStatus);
    if (statusIssue) {
      await response.body?.cancel();
      return report({ requestUrl, httpStatus, latencyMs: Date.now() - startedAt, issues: [statusIssue] });
    }
    if (!isJsonContentType(response.headers.get('content-type'))) {
      await response.body?.cancel();
      return report({
        requestUrl,
        httpStatus,
        latencyMs: Date.now() - startedAt,
        issues: [transportIssue('CONTENT_TYPE_INVALID', 'Content-Type must be application/json')],
      });
    }

    let bytes: Uint8Array | null;
    try {
      bytes = await readBody(response, PROFILE_LIMITS.maxBytes);
    } catch (err) {
      return requestFailed(err, httpStatus);
    }
    const latencyMs = Date.now() - startedAt;
    if (bytes === null) {
      return report({
        requestUrl,
        httpStatus,
        latencyMs,
        issues: [transportIssue('RESPONSE_TOO_LARGE', `Body is larger than ${PROFILE_LIMITS.maxBytes} bytes`)],
      });
    }

    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return report({
        requestUrl,
        httpStatus,
        latencyMs,
        issues: [{ code: 'INVALID_JSON', kind: 'envelope', path: '', message: 'Body is not valid UTF-8' }],
      });
    }

    const { issues, preview } = validateUsernameProfile(text, { expectedUsername: username });
    return report({ requestUrl, httpStatus, latencyMs, issues, preview });
  } finally {
    clearTimeout(timer);
  }
}
