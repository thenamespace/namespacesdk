# @thenamespace/universal-usernames

Universal Usernames let a brand that owns `brandname.eth` serve every username
from its own HTTPS endpoint. When someone looks up `happy.brandname.eth`,
Namespace asks your endpoint for `happy` and answers ENS with the records you
return. Users don't claim, mint or sign anything.

This package holds the profile format and the shared rules:

- `defineUsernameProfile`, `createUsernameHandler`: build the endpoint.
- `universal-usernames validate`: check the endpoint the way Namespace will.
- `parseUsernameProfile`, `resolveText`, `resolveAddress`, `resolveContenthash`,
  `checkEndpointUrl`: the parser and record rules Namespace services use.

## Install

```sh
npm install @thenamespace/universal-usernames
```

Requires Node.js 18.3 or newer. The package is CommonJS and includes TypeScript types.

## Quickstart for brands

### 1. Serve profiles

Namespace sends `GET {your endpoint URL}/{username}` with
`Accept: application/json`. Answer `200` with a profile, or `404` when the
username doesn't exist.

`createUsernameHandler` returns a Fetch API handler, so it plugs into Next.js
route handlers, Hono, Bun, Deno and Cloudflare Workers. In a Next.js app,
`app/ens/users/[username]/route.ts`:

```ts
import { createUsernameHandler, defineUsernameProfile } from '@thenamespace/universal-usernames';

// Replace with a lookup in your own database.
const users = new Map([
  ['happy', { displayName: 'Happy', wallet: '0x1111111111111111111111111111111111111111', github: 'happy' }],
]);

export const GET = createUsernameHandler(
  async (username) => {
    const user = users.get(username);
    if (!user) return null; // 404: the username doesn't resolve

    return defineUsernameProfile({
      username,
      texts: { name: user.displayName, 'com.github': user.github },
      addresses: { evm: user.wallet }, // one address for ETH and every EVM chain
    });
  },
  {
    basePath: '/ens/users',
    bearerToken: process.env.UUN_BEARER_TOKEN, // optional; omit to serve without a token
  }
);
```

Your endpoint URL is then `https://your-app.example/ens/users`.

`defineUsernameProfile` normalizes the username, turns chain names (`eth`,
`btc`, `sol`, `base`, `evm`, ...) into ENS coin types and drops `null` or
`undefined` values. It doesn't validate record values: one bad record makes
only that record fail, not the whole profile.

The handler answers `401` when a bearer token is configured and the request
doesn't send it, and `404` for any path that isn't `{basePath}/{normalized username}`.

### 2. Check the endpoint

```sh
npx @thenamespace/universal-usernames validate https://your-app.example/ens/users \
  --username happy --token "$UUN_BEARER_TOKEN"
```

It prints a JSON report and exits `0` when the endpoint passes, `1` otherwise.
The check uses the same rules as Namespace: HTTPS only, a 5 second deadline,
256 KiB at most, no redirects, `Content-Type: application/json`.

To point it at a local `http://` server while developing, set
`UUN_ALLOW_INSECURE_ENDPOINTS=true`. Namespace itself only calls HTTPS endpoints.

## Profile format (v1)

```json
{
  "version": 1,
  "username": "happy",
  "texts": { "name": "Happy", "avatar": "https://cdn.brand.example/happy.png", "com.github": "happy" },
  "addresses": {
    "60": "0x1111111111111111111111111111111111111111",
    "2147492101": "0x2222222222222222222222222222222222222222",
    "0": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
  },
  "contenthash": "ipfs://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA"
}
```

- `username` must equal the requested username exactly.
- `texts` and `addresses` are required and may be empty. Leave out missing
  records; don't send `null`.
- Text keys are open (standard ENS keys or your own, like `com.brand.role`).
  Values are plain text, never HTML.
- Address keys are decimal ENS coin types ([ENSIP-9], [ENSIP-11]). Values are
  the human-readable address for that chain.
- `2147483648` is the default EVM address ([ENSIP-19]). Coin type `60` and every
  EVM chain without its own record resolve to it. A chain's own record always
  wins, and an invalid chain record fails instead of falling back. Non-EVM coins
  never use it.
- `contenthash` accepts `ipfs://`, `ipns://`, `bzz://` and `ar://`.
- Limits: 128 texts, 128 addresses, text keys 1 to 256 characters, text values
  up to 4096, addresses up to 1024, contenthash up to 4096, 256 KiB per response.

Unknown fields, duplicate keys or a wrong `username` reject the whole profile.
A bad text, address or contenthash fails only that record.

`USERNAME_PROFILE_SCHEMA_V1` exports the JSON Schema. Duplicate keys, username
matching and address and contenthash encoding go beyond what JSON Schema can
check, so use `validateUsernameProfile` or the CLI for a full check.

## API for Namespace services

```ts
import {
  checkEndpointUrl,
  buildProfileUrl,
  isNormalizedUsername,
  parseUsernameProfile,
  resolveAddress,
} from '@thenamespace/universal-usernames';

const url = checkEndpointUrl('https://api.brand.example/ens/users');
if (!url.ok) throw new Error(url.issue.message);
if (!isNormalizedUsername('happy')) throw new Error('not a username');

const response = await fetch(buildProfileUrl(url.url, 'happy'));
const parsed = parseUsernameProfile(await response.text(), { expectedUsername: 'happy' });
if (parsed.profile) {
  resolveAddress(parsed.profile, 60); // { status: 'found', value: '0x…' } | { status: 'absent' } | { status: 'invalid', issue }
}
```

Production fetching must also block private destinations, cap time and size,
and refuse redirects. `checkEndpointUrl` checks only the URL's shape.

Every issue has a stable `code`, a `kind` (`envelope`, `record` or `transport`)
and a JSON Pointer `path` into the body.

## Fixtures

`fixtures/valid/*.json` and `fixtures/invalid/*.json` ship with the package.
`fixtures/index.json` lists the expected issues for each invalid file and the
expected resolved values (hex bytes) for each valid one, so other services can
test against the same cases:

```ts
const index = require('@thenamespace/universal-usernames/fixtures/index.json');
```

[ENSIP-9]: https://docs.ens.domains/ensip/9
[ENSIP-11]: https://docs.ens.domains/ensip/11
[ENSIP-19]: https://docs.ens.domains/ensip/19
