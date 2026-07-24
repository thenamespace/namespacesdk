# Version 2.0.0 release workflow

Treat this checklist as ordered and gated. Adapt command names to the repository's package manager and scripts.

## Prepare

1. Confirm the intended commit, clean worktree, release branch, package name, registry, current published versions, and npm dist-tags.
2. Confirm the `2.0.0` scope and breaking changes are documented, especially SIWE v4, chain defaults/selection, routes, response fields, and legacy compatibility.
3. Set the package version to exactly `2.0.0` through the package manager without creating an unintended tag.
4. Update all workspace references and lockfile entries consistently.
5. Verify exports, type declarations, runtime targets, files allowlist, repository metadata, license, and publish configuration.

## Verify

1. Perform an immutable/frozen clean install.
2. Run formatting, lint, type checks, tests, integration tests, build, and any repository release checks.
3. Run the package manager's pack or publish dry run.
4. Inspect the tarball filename, contents, unpacked size, version, entry points, type declarations, and absence of secrets or development-only files.
5. Install the tarball into a temporary consumer project and smoke-test supported import styles plus mainnet-default and explicit-Sepolia behavior when feasible.
6. Record exact commands, versions, and results for the PR.

## Draft PR

1. Commit only the intended package, tests, documentation, manifest, and lockfile changes.
2. Push the release branch.
3. Open a draft PR titled for `@thenamespace/avatar` version `2.0.0`.
4. Describe breaking changes, migration guidance, security review, compatibility behavior, lockfile rationale, tarball inspection, and test evidence.
5. Wait for required CI, review, and release approval. Keep the PR draft until the project owner decides it is ready.

## Publish after explicit approval

1. Reconfirm the merged release commit and rerun required checks from that exact commit.
2. Authenticate to the expected npm registry without printing the token or the full npm configuration.
3. Publish `@thenamespace/avatar@2.0.0` with the intended access and dist-tag.
4. Verify the registry version, integrity/provenance when configured, dist-tag, and clean-room install.
5. Create and push the exact repository tag only according to project convention.
6. Create the GitHub release from that tag with migration notes.
7. Report package URL, version, tag, release URL, verification results, and any follow-up work.

Never overwrite an existing `2.0.0`, reuse a tag that points elsewhere, or move a dist-tag without checking current registry state. If any verification differs from the reviewed commit or packed artifact, stop and investigate.
