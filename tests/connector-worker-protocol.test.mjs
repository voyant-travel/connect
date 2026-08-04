import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CONNECTOR_WORKER_PROTOCOL_VERSION,
  connectorWorkerOperationPaths,
} from "../packages/connect-provider-sdk/dist/hosted-worker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const surfacePath = path.join(
  __dirname,
  "..",
  "packages",
  "connect-provider-sdk",
  "protocol-surface.json",
);

const surface = JSON.parse(readFileSync(surfacePath, "utf8"));

/**
 * Canonical checksum of the operation table: every operation and its path,
 * sorted by operation name so key order in the source cannot change it.
 */
function checksumOperationTable(paths) {
  const canonical = Object.keys(paths)
    .sort()
    .map((operation) => `${operation}=${paths[operation]}`)
    .join("\n");

  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

test("the recorded protocol surface matches the operation table", () => {
  const actual = checksumOperationTable(connectorWorkerOperationPaths);

  assert.equal(
    actual,
    surface.operationsChecksum,
    [
      "The connector worker operation table changed.",
      "",
      "The protocol version is the compatibility axis a third-party connector",
      "declares against (ADR-0022), so a surface change needs a version bump:",
      "",
      "  1. bump CONNECTOR_WORKER_PROTOCOL_VERSION to today's date",
      "  2. update protocol-surface.json — version, operationsChecksum, operationCount",
      "",
      `expected checksum: ${surface.operationsChecksum}`,
      `actual checksum:   ${actual}`,
    ].join("\n"),
  );
});

test("the recorded protocol version matches the exported constant", () => {
  assert.equal(CONNECTOR_WORKER_PROTOCOL_VERSION, surface.version);
});

test("the recorded operation count matches the operation table", () => {
  assert.equal(
    Object.keys(connectorWorkerOperationPaths).length,
    surface.operationCount,
  );
});

test("the protocol version is an ISO date", () => {
  assert.match(CONNECTOR_WORKER_PROTOCOL_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test("every operation maps to a distinct path", () => {
  const paths = Object.values(connectorWorkerOperationPaths);

  assert.equal(
    new Set(paths).size,
    paths.length,
    "two operations share an HTTP path",
  );
});

test("every operation path is rooted", () => {
  for (const [operation, routePath] of Object.entries(
    connectorWorkerOperationPaths,
  )) {
    assert.match(
      routePath,
      /^\//,
      `${operation} maps to a path that does not start with "/"`,
    );
  }
});
