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

To build sources from an explicit client instead of the environment, use
`createVoyantConnectSources` / `registerVoyantConnectSources`, pointing the
client at `https://api.voyant.travel`.

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
