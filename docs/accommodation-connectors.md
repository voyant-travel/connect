# Accommodation connectors

An accommodation connector is a separately deployed HTTP service. It declares
stay operations and maps them to a backend chosen by its developer: a PMS,
supplier API, database, or another reservation service. Managed deployments
consume it through Voyant Connect; the connector does not import the private
catalog/runtime packages.

## Public authoring contract

Import `createAccommodationConnector`, `AccommodationHandlers`, the accommodation
catalog and stay schemas from
`@voyant-travel/connect-provider-sdk/accommodations`. Implement `searchStays`,
`confirmStay`, `cancelStay`, and `getStayBooking`; implement `quoteStay` and
`lockStay` when the backend can revalidate prices and reserve inventory. The
handler serves `/.well-known/voyant-connect/manifest`, verifies Connect's HMAC
signature and timestamp against `signingSecret`, validates each input and output,
and binds input connection identity to the authenticated context.

Rates and reservations remain authoritative in the connector backend. Offers
carry stable room-type/rate-plan keys, exact occupancy, each occupied night's
price, currency precision, policies, and expiry. Checkout day is excluded. Never
update a shared Product price rule to encode an individual shopper's stay.

Confirmation must replay against a stable hold/attempt identity without creating
another reservation. `context.idempotencyKey` may be absent on older accommodation
dispatchers; `input.holdId` is the stable Connect confirmation identity. A native
hold reference is passed separately. Expire native holds in the backend, and
make cancellation and external-reference lookup support reconciliation.

## Developer access

Managed organizations use **Settings → Connect Developer**, also available in
**Catalog → Supply connections → Developer**. Install a registration manifest
there to create an organization-owned private provider and receive its one-time
signing secret. Production organizations can use this setup as well as demos.
Pass public business metadata through the helper's optional `registration` option,
including `authModel`, `credentialForm`, and business `capabilities` such as
`catalog_read`, `availability_read`, `booking_create`, and `booking_manage`.
The helper puts it under `registration` in the canonical discovery manifest,
binds its key and category to the accommodation connector, and keeps callable
operation discovery separate. Install the URL ending in
`/.well-known/voyant-connect/manifest`. Never include real credentials there.
Voyant validates the registration metadata when installing the provider.

Store the signing secret on the connector Worker before registering a connection.
Implement `validateCredentials` to check the chosen backend and return supported
markets; the worker helper dispatches it through the same signed protocol.

Create an expiring Connect API token on the same screen with only the required
Connect permissions. `connect:accommodations:write` permits catalog publication;
read-only stay search uses `connect:accommodations:read`. The page supplies the
central API URL and operator ID. Tenant runtime API keys from Settings → API are
separate credentials and cannot authenticate the central Connect API. Tokens
are shown once, stored hashed by the platform, and can be revoked; the gateway
forwards their restrictions to Connect's vertical authorization checks.

## Catalog publication

Publish descriptive properties, room types, and rate plans using the consumer
client's `accommodations.ingestCatalogChunk(connectionId, {section, rows})`.
Capture `syncStartedAt` before the first chunk and call
`finalizeCatalogSync(connectionId, syncStartedAt)` only after every chunk has
succeeded. Finalization prunes obsolete catalog rows for that connection; it is
not a partial-update endpoint. Prices and availability are resolved live.

Install the private connector with a registration manifest declaring
`metadata.externalAdapter = {type: 'external_adapter', baseUrl, protocolVersion}`.
Registration returns a signing secret, which belongs in the connector's secret
store. Register credentials and connect it for the owning operator, then publish
its inventory through the intended sales channel. The protocol manifest's
operation list and registration manifest's business capabilities have different
purposes; do not interchange them.

## Verification

Run `runAccommodationConformance` against disposable backend inventory. It checks
search/quote/hold/confirm, duplicate confirmation, selected room/rate, accepted
price, booking lookup, and cancellation. Also test overlapping stays, sold-out
nights, expired holds, seasonal boundaries, guest occupancy, and invalid signatures.

The beactive demo's `connector/` project is a D1-backed reference implementation.
A deployed connector and successful conformance do not by themselves prove that
a managed tenant's released checkout supports sourced accommodation sessions.
That requires the catalog publication, supported runtime, and hosted journey too.
