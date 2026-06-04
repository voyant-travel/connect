---
"@voyantjs/connect-adapter": patch
---

Fix sourced stay quotes. `liveResolve` now emits flat `priceCents` + `currency` alongside the `price` money object (the catalog quote engine's pricing reader expects a numeric `priceCents`/`currency`, not a money object, so stay quotes previously extracted no pricing). It also infers the `stays` route from the query shape (`rooms[]` + check-in/out) when `connectRoute` isn't set explicitly, so sourced accommodation quotes no longer fall through to the generic availability path.
