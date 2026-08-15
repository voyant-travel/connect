---
"@voyant-travel/connect-adapter": patch
---

Resolve cruises keyed by an encoded SourceRef.

The catalog keys sourced cruises as `crus_sr_<base64url(JSON)>`, but the
adapter only understood the legacy `cruise:<externalId>:<locale>` form. No
candidate ever reduced to the upstream external id, so the per-id lookup 404'd,
the fallback list scan matched nothing, and `getContent` threw
`Connect cruise content not found` — surfacing as a 500 on every sourced cruise
detail read, admin and storefront. Encoded keys are now decoded to the external
id before any lookup.
