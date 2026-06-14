# `@voyant-travel/connect-cruises`

Voyant Connect cruises adapter for Voyant deployments.

Use this package in a Voyant deployment that wants cruise inventory from
Voyant Connect to appear through the Voyant cruises adapter contract.

## Install

```sh
pnpm add @voyant-travel/connect-cruises @voyant-travel/connect-sdk
```

## Usage

```ts
import { createConnectCruiseAdapter } from "@voyant-travel/connect-cruises";

const adapter = createConnectCruiseAdapter({
  connect: {
    apiKey: process.env.VOYANT_API_KEY!,
    operatorId: "op_123",
    baseUrl: "https://api.voyant.travel",
  },
});

void adapter;
```

## Status

This package is the public package boundary for Connect-backed cruises. The
current scaffold implements list, detail, itinerary, ship, sailing pricing, and
reserve-mode booking commit mappings for routes exposed by
`@voyant-travel/connect-sdk`.

Booking commit asks Connect to lock the selected sailing/cabin/fare/occupancy
when the caller does not provide `cabinCategoryRef.quoteId`, then confirms that
quote through Connect cruise bookings.

## Notes

- `@voyant-travel/connect-sdk` remains the general Connect API client.
- Provider integration authors should use `@voyant-travel/connect-provider-sdk`.
- Supplier-specific connectors should live in provider-owned packages when
  maintenance is handed off.

For repo-level context, see [../../docs/connect-cruises.md](../../docs/connect-cruises.md).
