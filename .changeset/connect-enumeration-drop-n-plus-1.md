---
"@voyant-travel/plugin-voyant-connect": patch
---

`listVoyantConnectSourceConnections` no longer issues a redundant per-connection
`get()` to enrich each row. `connections.list` already returns the full
`ConnectionSummary` (`id`/`status`/`providerKey`/`supplierName`) — the same shape
`get` returns — so enumeration is now a single round-trip instead of `1 + N`,
shedding N requests against the Connect control plane per warm. No behavior or
API change.
