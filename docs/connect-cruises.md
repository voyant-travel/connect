# Connect Cruises

`@voyant-travel/connect-cruises` adapts Connect-normalized cruise inventory into a
Voyant deployment's cruises adapter boundary.

The package belongs in this public Connect monorepo because it is an adapter
bridge for Connect consumers. It does not contain supplier-specific cruise
connector code.

## Install

```sh
pnpm add @voyant-travel/connect-cruises @voyant-travel/connect-sdk
```

## Example

```ts
import { createConnectCruiseAdapter } from "@voyant-travel/connect-cruises";

export const adapter = createConnectCruiseAdapter({
  connect: {
    apiKey: process.env.VOYANT_API_KEY!,
    operatorId: "op_123",
  },
});
```

## Current Status

The initial package boundary provides:

- `createConnectCruiseAdapter`
- full `SourceRef` shape for connection/provider/external id identity
- list/detail/itinerary/ship/sailing-pricing mappings for exposed Connect
  cruise read APIs
- reserve-mode booking commit: the adapter asks Connect to lock the selected
  sailing/cabin/fare/occupancy when `cabinCategoryRef.quoteId` is not already
  present, then confirms the quote through Connect cruise bookings

Future work should fill the missing Connect endpoints, then replace the
structural adapter types with direct `@voyant-travel/cruises` type imports once the
Voyant contract package is available as a stable peer dependency.
