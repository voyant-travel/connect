---
"@voyantjs/connect-cruises": patch
---

Lift the catalog sailing summary (departure count + next/earliest departure) onto cruise search projection and summary entries (`departureCount`, `nextDeparture`, `earliestDeparture`), read from the projection's `sailings` rollup. Lets browse cards show "N departures / from <date>" without a per-cruise sailings fetch; null when the catalog has no sailings.
