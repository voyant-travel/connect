---
"@voyantjs/connect-cruises": patch
---

Read itinerary day descriptions + times from `payload`. `fetchSailingItinerary` substituted the port `title` for each day's `description` (so days repeated the port name and the real narrative was dropped) and hardcoded `arrivalTime`/`departureTime` to null. It now reads `payload.description` and the row's `arriveAt`/`departAt`.
