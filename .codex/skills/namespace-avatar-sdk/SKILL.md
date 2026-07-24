---
name: namespace-avatar-sdk
description: Maintain, secure, test, publish, and release the `@thenamespace/avatar` package. Use for Namespace Avatar SDK work involving SIWE v4 authentication, Ethereum chain selection or wallet switching, avatar/header routes and response compatibility, credential-safe errors, dependency or lockfile review, draft pull requests, and the 2.0.0 release workflow.
---

# Namespace Avatar SDK

## Establish scope

1. Inspect the package manifest, source, tests, lockfile, CI, and release configuration before editing.
2. Preserve the public API unless the requested release explicitly permits a breaking change.
3. Separate required package changes from unrelated repository cleanup.
4. Never print, commit, paste into PR text, or return SIWE messages, signatures, bearer tokens, cookies, private keys, or full authentication payloads.
5. Read [references/contracts.md](references/contracts.md) before changing authentication, chain behavior, routes, response normalization, or errors.
6. Read [references/release-2.0.0.md](references/release-2.0.0.md) before publishing a draft PR or preparing version `2.0.0`.

## Implement changes

1. Treat mainnet as the default when the caller omits a chain.
2. Accept explicit Sepolia without silently rewriting it to mainnet.
3. Resolve the target chain once and use it consistently for provider validation, SIWE authentication, API requests, and returned state.
4. Validate the connected provider chain before requesting a signature or sending an authenticated request.
5. Request a wallet chain switch when supported; verify the chain again afterward; otherwise fail with an actionable, credential-safe error.
6. Keep `/avatar` and `/h` as the canonical avatar and header routes.
7. Normalize successful responses to `avatarUrl` and `headerUrl`. Read legacy `url` only as a compatibility fallback; do not make it the new canonical output.
8. Normalize unknown failures into stable public errors. Preserve useful status, code, and safe message data, but redact authentication material and avoid serializing entire request, provider, or response objects.
9. Keep browser and Node behavior aligned where the package supports both.

## Review security

1. Trace credentials from creation through transport, error handling, logs, tests, and PR artifacts.
2. Confirm SIWE domain, URI, nonce, chain ID, issued-at/expiration semantics, and signature verification follow the v4 contract used by the repository.
3. Confirm every authenticated request uses credentials only for its intended origin and chain.
4. Reject chain mismatch before sensitive operations; do not trust cached chain state after a switch.
5. Check URL handling, untrusted server messages, object spreading, JSON serialization, and error causes for accidental secret exposure.
6. Check dependencies and generated artifacts for unexpected executable or publish-time behavior.

## Protect dependency integrity

1. Make dependency changes through the repository's declared package manager.
2. Keep manifest and lockfile changes in the same commit.
3. Reject unexplained lockfile-wide churn, registry changes, integrity changes without version changes, duplicate resolutions, or lifecycle-script additions.
4. Reinstall from the lockfile in a clean environment when practical and verify the package tree or immutable/frozen install succeeds.
5. Do not hand-edit integrity hashes.

## Test

1. Add focused tests for each changed contract, including the negative path.
2. Cover omitted-chain mainnet, explicit Sepolia, matching provider, switch success, switch rejection/failure, post-switch mismatch, `/avatar`, `/h`, canonical fields, legacy `url`, malformed responses, and secret-safe errors as applicable.
3. Run formatting, lint, type checking, unit/integration tests, build, and package/publish dry-run commands defined by the repository.
4. Inspect the packed tarball for unexpected files, credentials, source maps, entry points, types, and version metadata.
5. Report commands and results exactly; distinguish failures introduced by the change from pre-existing or environment-dependent failures.

## Publish safely

1. Review the final diff and package contents before committing.
2. Keep the branch and commits scoped to the Avatar SDK work.
3. Open a **draft** PR unless the user explicitly requests otherwise.
4. Include behavior changes, compatibility notes, security considerations, test evidence, and remaining release steps in the PR body.
5. Do not publish to npm, create a GitHub release, merge, tag, or push a non-draft release action without explicit authorization.

## Release 2.0.0

Follow [references/release-2.0.0.md](references/release-2.0.0.md) as a gated workflow. Stop before each externally visible or irreversible action unless the user has authorized it. Treat npm publication, tag creation, GitHub release creation, and dist-tag changes as separate release actions.
