---
"@voyantjs/connect-sdk": patch
"@voyantjs/connect-adapter": patch
---

Add `board` + `stars` facets to `SearchDocument` (and carry them through the connect-adapter catalog projection), mirroring the platform's first-class filter facets so consumers can build/apply board-basis and star-rating filters.
