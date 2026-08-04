---
"@voyant-travel/connect-adapter": patch
---

Widen the `catalog-contracts` peer to the range that actually compiles.

`^0.112.2` on a 0.x means `>=0.112.2 <0.113.0`. Building the adapter against
each published minor shows `0.113.0` compiles and `0.114.0` does not —
`GetReservationResult.upstream_ref` became required while the request field
became optional — so the supported window is `>=0.112.2 <0.114.0`.

This is a correction, not a catch-up. `catalog-contracts` is at `0.117.1`; the
adapter is three breaking minors behind it and no range change closes that gap.
Supporting `>=0.114.0` needs the reservation-lookup contract change
implemented, which is tracked separately.
