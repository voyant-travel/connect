---
"@voyantjs/connect-sdk": minor
---

Add a typed `client.packages` domain mirroring `client.stays` — `search` / `searchAcrossProviders` (offers + per-connection diagnostics), `lock` / `releaseLock` / `getHold`, and `confirm` / `cancel` / `get` / `list` / `listAll`. Callers no longer drop to raw `transport.request` for the package (flight + stay) data plane. A canonical `destination.countryCode`/`region`/`city` is resolved to the supplier's accommodations server-side, keeping callers on one model across providers.

Also surface the canonical failure classification — `ConnectionDiagnostic.code` and `StaySearchResponse.errorCode` / `PackageSearchResponse.errorCode` (e.g. `PROVIDER_REJECTED_REQUEST`, `UNSUPPORTED_OPERATION`, `UPSTREAM_UNAVAILABLE`) — so callers can branch on the failure class without parsing messages.

Internal: the route-parity tooling now syncs `packages.ts` and excludes the internal connector self-registration route (`PUT /connect/v1/connector-providers/:key/manifest`) from the public manifest, so `pnpm verify` is fully green.
