# Changesets

This repo publishes the `@voyant-travel/cloud-sdk` package.

Use Changesets to:

- record user-visible package changes
- generate version bumps and changelog entries on release

While `@voyant-travel/cloud-sdk` is in 0.x, `pnpm version-packages` demotes any `major`
changeset to `minor` so the package never accidentally crosses to 1.0.0 before
we declare it stable. See [`docs/releases.md`](../docs/releases.md).

Internal-only workspace changes do not need a public changeset unless they
affect published package behavior.
