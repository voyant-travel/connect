---
"@voyantjs/connect-provider-sdk": minor
---

Add the accommodations (stays) operations to the hosted-worker protocol: `searchStays`, `lockStay`, `confirmStay`, `cancelStay`, `getStayBooking`, with their `/stays/*` operation paths. Lets a hosted connector worker serve the stays data plane alongside the existing cruise operations; the protocol version is unchanged.
