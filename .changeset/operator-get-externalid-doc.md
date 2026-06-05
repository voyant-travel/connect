---
"@voyantjs/connect-sdk": patch
---

Clarify that `accommodations.get(...)` (operator-scoped) takes the internal id only — a provider externalId isn't unique across an operator's connections. Resolve an externalId via `accommodations.list({ externalId })` or the connection-scoped `getOnConnection`, both of which still accept it.
