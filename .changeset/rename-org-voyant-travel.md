---
"@voyant-travel/connect-sdk": minor
"@voyant-travel/connect-adapter": minor
"@voyant-travel/connect-provider-sdk": minor
"@voyant-travel/connect-cruises": minor
---

Rename the npm scope from `@voyantjs` to `@voyant-travel` to match the renamed
org. All packages, imports, repository/homepage URLs, and the default API base
URL (`api.voyantjs.com` → `api.voyant.travel`) are updated. Consumers must update
their dependencies to the `@voyant-travel/*` scope and re-point any pinned
`@voyantjs/connect-*` imports.
