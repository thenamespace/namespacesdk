import { transportIssue } from './issues';
import { isNormalizedUsername, UsernameError } from './normalize';
import type { ValidationIssue } from './types';

const MAX_ENDPOINT_URL_LENGTH = 2048;

export type EndpointUrlCheck = { ok: true; url: string } | { ok: false; issue: ValidationIssue };

/**
 * Checks a brand endpoint URL: `https:` only (`http:` too with
 * `allowInsecure`, for local tests), no userinfo, no query string, no
 * fragment, at most 2048 characters. A path is allowed. On success returns the
 * parsed URL without trailing slashes.
 *
 * This checks the URL's shape only. Blocking private or internal destinations
 * is the fetcher's job, because it depends on DNS.
 */
export function checkEndpointUrl(url: string, options: { allowInsecure?: boolean } = {}): EndpointUrlCheck {
  const invalid = (message: string): EndpointUrlCheck => ({
    ok: false,
    issue: transportIssue('INVALID_URL', message),
  });

  if (typeof url !== 'string' || url.length === 0) return invalid('Endpoint URL is empty');
  if (url.length > MAX_ENDPOINT_URL_LENGTH) {
    return invalid(`Endpoint URL is longer than ${MAX_ENDPOINT_URL_LENGTH} characters`);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return invalid('Endpoint URL is not a valid absolute URL');
  }

  const insecureAllowed = options.allowInsecure === true;
  if (parsed.protocol !== 'https:' && !(insecureAllowed && parsed.protocol === 'http:')) {
    return invalid(insecureAllowed ? 'Endpoint URL must use https or http' : 'Endpoint URL must use https');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return invalid('Endpoint URL must not contain a username or password');
  }
  // The URL parser drops an empty "?" or "#", so check the raw text as well.
  if (parsed.search !== '' || url.includes('?')) return invalid('Endpoint URL must not have a query string');
  if (parsed.hash !== '' || url.includes('#')) return invalid('Endpoint URL must not have a fragment');

  const normalized = parsed.href.replace(/\/+$/, '');
  if (normalized.length > MAX_ENDPOINT_URL_LENGTH) {
    return invalid(`Endpoint URL is longer than ${MAX_ENDPOINT_URL_LENGTH} characters`);
  }
  return { ok: true, url: normalized };
}

/**
 * `{endpointUrl without trailing slash}/{encodeURIComponent(label)}`.
 *
 * @throws UsernameError when `label` is not a normalized single ENS label.
 */
export function buildProfileUrl(endpointUrl: string, label: string): string {
  if (!isNormalizedUsername(label)) {
    throw new UsernameError('Username must be a normalized ENS label');
  }
  return `${endpointUrl.replace(/\/+$/, '')}/${encodeURIComponent(label)}`;
}
