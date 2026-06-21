# `@voyant-travel/plugin-voyant-connect`

Voyant Connect sources plugin for Voyant deployments.

Use this package in a Voyant deployment to turn Connect credentials into the
catalog `SourceAdapter`s that source generic inventory, structured cruises, and
provider package products — without wiring each adapter by hand.

## Install

```sh
pnpm add @voyant-travel/plugin-voyant-connect @voyant-travel/connect-sdk
```

## Usage

```ts
import { prepareVoyantConnectSources } from "@voyant-travel/plugin-voyant-connect";

// Reads VOYANT_API_KEY / VOYANT_CONNECT_* from the environment and returns the
// catalog source adapters to register, or [] when Connect is unconfigured.
const sources = await prepareVoyantConnectSources(process.env);

void sources;
```

On the booking-engine warm path, pass `enumerate: true` to get one set of
connection-scoped adapters per active connection. To avoid re-paying the network
enumeration on every cold isolate, supply a pre-fetched `connections` list or a
read-through `connectionCache` (e.g. backed by Workers KV), and thread
`cruise.memoize` to wrap cruise reads consistently across the default and
per-connection planes:

```ts
const sources = await prepareVoyantConnectSources(env, {
  enumerate: true,
  // Skip the list() call when the serializable connection list is cached:
  connectionCache: {
    get: () => cache.get("voyant-connect:connections"),
    set: (connections) => cache.put("voyant-connect:connections", connections),
  },
  // Memoize cruise reads on both the default and per-connection adapters:
  cruise: { memoize: { ttlMs: 60_000 } },
});
```

Pass a pre-fetched `connections` array instead of `connectionCache` when the
caller already holds the list. To build sources from an explicit client instead
of the environment, use `createVoyantConnectSources` /
`registerVoyantConnectSources`, pointing the client at
`https://api.voyant.travel`.

## Status

This is the public package boundary for wiring Connect into a Voyant catalog.
It composes the `@voyant-travel/connect-adapter` (generic + product packages)
and `@voyant-travel/connect-cruises` (structured cruises) adapters, resolves
geography names, and registers connection-scoped sources on the catalog
registry.

## Notes

- `@voyant-travel/connect-sdk` remains the general Connect API client.
- `@voyant-travel/catalog`, `@voyant-travel/cruises`, and
  `@voyant-travel/data-sdk` are peer dependencies provided by the host Voyant
  deployment.

For repo-level context, see [../../docs/connect-plugin.md](../../docs/connect-plugin.md).
