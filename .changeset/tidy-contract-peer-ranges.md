---
"@voyant-travel/connect-adapter": patch
"@voyant-travel/connect-flights": patch
---

Move Voyant development dependencies to the current published contract and runtime lines, and constrain pre-1.0 peers to those compatible minor lines so future breaking minors produce an install-time incompatibility instead of silently matching.
