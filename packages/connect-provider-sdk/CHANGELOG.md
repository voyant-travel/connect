# @voyantjs/connect-provider-sdk

## 0.2.0

### Minor Changes

- 25dd6ee: Add the accommodations (stays) operations to the hosted-worker protocol: `searchStays`, `lockStay`, `confirmStay`, `cancelStay`, `getStayBooking`, with their `/stays/*` operation paths. Lets a hosted connector worker serve the stays data plane alongside the existing cruise operations; the protocol version is unchanged.

## 0.1.2

### Patch Changes

- Expose hosted connector Worker protocol helpers from `@voyantjs/connect-provider-sdk/hosted-worker`.
