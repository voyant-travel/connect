---
"@voyantjs/connect-sdk": patch
"@voyantjs/connect-adapter": patch
---

Add `supplyModel` to `SearchDocument` (and carry it through the connect-adapter catalog projection), mirroring the platform's first-class facet. `supplyModel` is the supply-model mechanic a catalog surface forks on — `dynamic` (composed-live, any-date, calendar pricing) vs `scheduled` (dated departures/slots with an allotment) — so consumers can split the catalog into search-first vs browse-departures surfaces. Product *type* stays in `category`.
