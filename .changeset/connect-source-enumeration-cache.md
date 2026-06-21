---
"@voyant-travel/plugin-voyant-connect": minor
---

`prepareVoyantConnectSources` can now build enumerate-path sources without a
network connection enumeration, and threads cruise read memoization through both
planes (#94):

- `connections` — pass a pre-fetched connection list to skip the `list()` call.
- `connectionCache` — a read-through `{ get, set }` hook (e.g. backed by Workers
  KV) so a cold isolate can reuse the serializable connection list.
- `cruise` — forwarded to both the default and per-connection sources, so
  `cruise.memoize` wraps cruise reads consistently across both.

All additive; existing callers are unaffected.
