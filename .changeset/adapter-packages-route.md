---
"@voyant-travel/connect-adapter": minor
---

Add the packages route to the generic Connect source adapter. Sourced package
products (e.g. TUI flight+hotel packages) previously fell through liveResolve
to the availability path — which the packages data plane cannot serve — so
every quote failed. The adapter now routes package-shaped quotes (departure
date + roomTypeId/ratePlanId/board pin, no rooms[]/departure slot) through
`packages.search`, pins the operator's room/board choice on the offer's stay
component, and emits the flat pricing fields the catalog quote engine reads.
Booking follow-through gains the matching branches: `connectRoute: "packages"`
reserve via `packages.confirm`, plus cancel/status for `package:` upstream
refs.
