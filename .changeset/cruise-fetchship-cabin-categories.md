---
"@voyantjs/connect-cruises": patch
---

Attach cabin categories in `fetchShip`. The ship read doesn't include cabin categories, so the cruise content's "Options" tab (and cabin pricing) had no catalog to bind. `fetchShip` now also calls `client.cruises.listCabinCategories` and attaches the mapped rows as `ship.categories`. Adds the `ConnectExternalCabinCategory` type + the ship `categories` field and a `toCabinCategory` mapper (code/name/roomType/occupancy/area/features/images, normalizing the room type — `studio` → `single`).
