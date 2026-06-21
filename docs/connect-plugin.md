# Connect Plugin

`@voyant-travel/plugin-voyant-connect` wires Voyant Connect into a Voyant
deployment's catalog by turning Connect credentials and connections into the
`SourceAdapter`s the catalog registers.

The package belongs in this public Connect monorepo because it is the
integration seam Connect consumers use to mount Connect sources. It composes the
public Connect adapters and contains no supplier-specific connector code.

## Install

```sh
pnpm add @voyant-travel/plugin-voyant-connect @voyant-travel/connect-sdk
```

## Example

```ts
import { prepareVoyantConnectSources } from "@voyant-travel/plugin-voyant-connect";

// Resolves Connect config from the environment (VOYANT_API_KEY /
// VOYANT_CONNECT_*), enumerates active connections, and returns the catalog
// source adapters to register. Returns [] when Connect is unconfigured.
export const sources = await prepareVoyantConnectSources(process.env);
```

For an explicit client (pointed at `https://api.voyant.travel`), use
`createVoyantConnectSources` to build the adapters and
`registerVoyantConnectSources` to mount them on the catalog registry.

## What it provides

- `prepareVoyantConnectSources` / `resolveVoyantConnectEnv`: environment-driven
  config resolution with the documented `VOYANT_API_KEY` fallback order
- `createVoyantConnectSources` / `registerVoyantConnectSources` /
  `listVoyantConnectSourceConnections`: per-connection source composition and
  catalog registration
- `createConnectCruiseSourceAdapter` / `skipCruiseConnectDocuments`: structured
  cruise sourcing on top of `@voyant-travel/connect-cruises`
- `createConnectProductPackageSourceAdapter`: provider package-product sourcing
- `createGeoNameResolver` / `createDestinationNameResolver`: geography name
  resolution for projection entries

## Peer dependencies

The plugin expects the host Voyant deployment to provide
`@voyant-travel/catalog`, `@voyant-travel/cruises`, and
`@voyant-travel/data-sdk`. The Connect adapters
(`@voyant-travel/connect-adapter`, `@voyant-travel/connect-cruises`) and the
Connect client (`@voyant-travel/connect-sdk`) are bundled from this workspace.
