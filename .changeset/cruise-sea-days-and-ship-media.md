---
"@voyant-travel/connect-adapter": patch
---

Read cruise sea days and ship media from the shapes Connect actually stores.

`is_at_sea` fell back to `getString(day, "portName") === undefined`, but no
stored itinerary row carries a `portName` key — the sailing payload uses
`title` and the itinerary table uses `port_name`. Every day of every sourced
cruise therefore reported "at sea" while displaying a real port name beside it.
It now reads `isSeaDay` / `is_sea_day` / `is_at_sea` and only falls back to
"there is no port name at all".

`toCruiseContentShip` also dropped the ship type and every image, so a ship with
a photo rendered as a bare name. It now emits `ship_type`, `gallery` and
`deck_plans`, accepting the media shapes connectors emit (string arrays,
`{ url }` objects, or a single URL string).
