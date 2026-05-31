# @voyantjs/connect-cruises

## 0.2.0

### Minor Changes

- 6420216: Carry canonical geography from the catalog projection onto the cruise search-projection entry. `toSearchProjection` now lifts `region_ids` / `waterway_ids` / `port_ids` / `country_iso` (canonical data-geo ids) and the parallel `waterways` / `ports` / `countries` name arrays off `OperatorCruiseSummary.projection`, so downstream catalog adapters can index them for cross-provider destination faceting. Fields are omitted when the projection has no resolved geography.

## 0.1.7

### Patch Changes

- Updated dependencies [9f31956]
  - @voyantjs/connect-sdk@0.1.6

## 0.1.6

### Patch Changes

- f4e8e75: Upgrade Voyant framework package peers and dev installs to the latest 0.85.3 line.

## 0.1.5

### Patch Changes

- Updated dependencies [10d4451]
  - @voyantjs/connect-sdk@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [306b849]
  - @voyantjs/connect-sdk@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [9825584]
  - @voyantjs/connect-sdk@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [e267f77]
  - @voyantjs/connect-sdk@0.1.2
