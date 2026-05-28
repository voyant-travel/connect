# Voyant Connect SDK

Public TypeScript SDKs for Voyant Connect APIs and integration packages.

This repo owns the public-facing Connect package family and its supporting
contract tooling. It does not contain a docs app. For now, repo documentation
lives as Markdown under [`docs/`](./docs).

## Packages

- `@voyantjs/connect-sdk`: client for Voyant Connect operator, connection, gateway, and flight APIs
- `@voyantjs/connect-provider-sdk`: primitives for building provider integrations
- `@voyantjs/connect-cruises`: Connect-backed cruises adapter for Voyant deployments
- `@voyant-sdk/sdk-core`: private shared runtime bundled into the public package

## Workspace layout

- `packages/connect-sdk`: public Voyant Connect SDK
- `packages/connect-provider-sdk`: public provider integration SDK
- `packages/connect-cruises`: public Voyant cruises adapter package for Connect
- `packages/sdk-core`: shared internal transport, auth, and error handling
- `packages/eslint-config`: shared ESLint presets for the workspace
- `packages/typescript-config`: shared TypeScript presets for the workspace
- `docs/`: lightweight repo docs until the unified docs app lands in `voyant`

## Commands

```sh
pnpm build
pnpm check-types
pnpm lint
pnpm test
pnpm changeset
pnpm sync:contracts
pnpm verify:client-route-coverage
pnpm verify:api-parity
pnpm verify:package-artifacts
pnpm verify:package-manifests
pnpm verify:readmes
pnpm verify
pnpm release
```

## Repo principles

- Shared runtime code stays private and minimal
- Provider-specific connectors can depend on this repo's public SDKs, but do
  not have to live in this repo
- The repo should stay publishable without a docs app or product-specific frontend code

## Docs

- [Overview](./docs/overview.md)
- [Repo Decisions](./docs/repo-decisions.md)
- [Contracts](./docs/contracts.md)
- [Release Model](./docs/releases.md)
- [Development](./docs/development.md)
- [Auth And Transport](./docs/auth-and-transport.md)
- [SDK Design](./docs/design.md)
- [Testing](./docs/testing.md)
- [Publishing](./docs/publishing.md)
- [Package APIs](./docs/package-apis.md)
- [FAQ](./docs/faq.md)
- [Connect SDK](./docs/connect.md)
- [Provider SDK](./docs/provider-sdk.md)
- [Connect Cruises](./docs/connect-cruises.md)
- [Roadmap](./ROADMAP.md)
