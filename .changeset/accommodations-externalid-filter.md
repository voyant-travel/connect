---
"@voyantjs/connect-sdk": minor
---

Look up accommodations by provider externalId, not just the internal id. `ListAccommodationsQuery` gains an `externalId?: string | string[]` filter (resolve provider hotel codes like TUI `AGP28009` → catalog rows), and `accommodations.get(...)` / `accommodations.getOnConnection(...)` now accept either the internal `csac_…` id or the externalId for the path identifier. Removes the dead-end where you had an externalId but every detail path required the internal id.
