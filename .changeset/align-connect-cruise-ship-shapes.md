---
"@voyant-travel/connect-cruises": minor
---

Align `ConnectExternalShip`/`ConnectExternalShipDeck`/`ConnectExternalCabinCategory`
and `ConnectCruiseSourceRef` with the cruise vertical's `ExternalShip` family so
`createConnectCruiseAdapter`'s return is assignable to `@voyant-travel/cruises`'
`CruiseAdapter` without a cast.

- `ConnectExternalShipDeck.imageUrl` is renamed to `planImageUrl` (the field the
  vertical's content mapper reads), so deck plan images are no longer silently
  dropped. Decks without a name are omitted, and `name` is now a required
  `string`.
- `ConnectExternalCabinCategory.wheelchairAccessible` narrows from
  `boolean | null` to `boolean`.
- `ConnectExternalCabinCategory.roomLayoutImages` is renamed to `floorplanImages`
  (the field the vertical reads), so cabin floorplan images are no longer
  silently dropped.
- `ConnectCruiseSourceRef.connectionId` is now optional to match the vertical's
  `SourceRef`; the adapter guards it via `requireConnectionId` before issuing
  connection-scoped Connect calls (throwing a clear error if it is missing
  instead of calling `/connections/undefined/...`).

Downstream consumers can drop the `conformConnectCruiseAdapter` seam and the
`as CruiseAdapter` cast.
