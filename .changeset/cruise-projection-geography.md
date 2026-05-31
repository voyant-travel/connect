---
"@voyantjs/connect-cruises": minor
---

Carry canonical geography from the catalog projection onto the cruise search-projection entry. `toSearchProjection` now lifts `region_ids` / `waterway_ids` / `port_ids` / `country_iso` (canonical data-geo ids) and the parallel `waterways` / `ports` / `countries` name arrays off `OperatorCruiseSummary.projection`, so downstream catalog adapters can index them for cross-provider destination faceting. Fields are omitted when the projection has no resolved geography.
