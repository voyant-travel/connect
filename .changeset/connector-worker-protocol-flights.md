---
"@voyant-travel/connect-provider-sdk": minor
---

Publish the flights data plane in the connector worker protocol, and make the
protocol version able to move.

The published protocol trailed the platform's internal copy by an entire
vertical: fifteen flight operations existed in production and in no published
package. The reference connector worked around it by hand-rolling its own
operation table, noting in a comment that the stays connector "did the same
dance". A protocol that connector authors fork cannot be the thing they declare
compatibility against — see ADR-0022 in the voyant repository.

- `ConnectorWorkerOperation` and `connectorWorkerOperationPaths` gain the
  fifteen flight operations, matching the platform surface exactly.
- `ConnectorWorkerContext` gains the request-scoped `requestId`,
  `correlationId`, `idempotencyKey` and `environment` fields the platform
  already sends. Connectors were reading them through a cast because the
  declared type was behind the wire format.
- `CONNECTOR_WORKER_PROTOCOL_VERSION` moves to `2026-08-04`. It had not been
  touched since the file was created, while twelve of the then twenty-two
  operations were added after it — and `verify:package-artifacts` asserted the
  frozen literal, so CI actively prevented the bump.

`protocol-surface.json` now records the version alongside a checksum of the
operation table, and `tests/connector-worker-protocol.test.mjs` fails when the
surface moves without a bump. The artifact check asserts the packed tarball
carries the recorded version rather than a hardcoded date, so the guardrail
catches an unversioned surface change instead of preventing every change.
