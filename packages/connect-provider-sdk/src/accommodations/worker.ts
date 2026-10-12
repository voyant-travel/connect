import { z } from "zod";
import {
  CONNECTOR_WORKER_PROTOCOL_VERSION,
  connectorWorkerManifestPath,
  connectorWorkerOperationPaths,
  type ConnectorWorkerContext,
} from "../hosted-worker.js";
import {
  stayOfferSchema,
  staySearchQuerySchema,
} from "./availability-search.js";
import { stayBookingSchema, stayConfirmInputSchema } from "./bookings.js";

const connection = { connectionId: z.string().min(1) };
export const accommodationOperations = {
  searchStays: {
    input: z.object({ ...connection, query: staySearchQuerySchema }),
    output: z.array(stayOfferSchema),
  },
  quoteStay: {
    input: z.object({ ...connection, offer: stayOfferSchema }),
    output: stayOfferSchema.nullable(),
  },
  lockStay: {
    input: z.object({ ...connection, offer: stayOfferSchema }),
    output: z
      .object({
        providerHoldRef: z.string().optional(),
        expiresAt: z.string().optional(),
      })
      .optional(),
  },
  confirmStay: {
    input: z.object({
      ...connection,
      offer: stayOfferSchema,
      input: stayConfirmInputSchema,
      providerHoldRef: z.string().optional(),
    }),
    output: stayBookingSchema,
  },
  cancelStay: {
    input: z.object({
      ...connection,
      booking: stayBookingSchema,
      options: z.object({ reason: z.string().optional() }).optional(),
    }),
    output: stayBookingSchema,
  },
  getStayBooking: {
    input: z.object({ ...connection, externalReference: z.string().min(1) }),
    output: stayBookingSchema.nullable(),
  },
} as const;
export type AccommodationOperation = keyof typeof accommodationOperations;
export type AccommodationHandlers = {
  [K in AccommodationOperation]: (
    context: ConnectorWorkerContext,
    input: z.infer<(typeof accommodationOperations)[K]["input"]>,
  ) => Promise<z.infer<(typeof accommodationOperations)[K]["output"]>>;
};

export class AccommodationConnectorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Verify the exact bytes and path Connect signs. No credentials are logged. */
export async function verifyConnectorSignature(
  request: Request,
  body: string,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const timestamp = request.headers.get("X-Voyant-Connector-Timestamp") ?? "";
  const signature = request.headers.get("X-Voyant-Connector-Signature") ?? "";
  if (
    !/^\d+$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300 ||
    !/^sha256=[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(signature.slice(7).match(/../g) ?? [], (hex) =>
    parseInt(hex, 16),
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes,
    new TextEncoder().encode(
      `${timestamp}${request.method}${new URL(request.url).pathname}${body}`,
    ),
  );
}

/** A backend-neutral HTTP handler for the public accommodation worker contract. */
export function createAccommodationConnector(options: {
  providerKey: string;
  displayName?: string;
  /** Public provider registration metadata (never backend credentials).
   * Voyant validates this separately from callable operation capabilities. */
  registration?: Record<string, unknown>;
  signingSecret: string;
  validateCredentials?: (
    context: ConnectorWorkerContext,
  ) => Promise<{ allowedMarkets?: string[]; scope?: Record<string, unknown> }>;
  handlers: Pick<
    AccommodationHandlers,
    "searchStays" | "confirmStay" | "cancelStay" | "getStayBooking"
  > &
    Partial<Pick<AccommodationHandlers, "quoteStay" | "lockStay">>;
}) {
  const operations = Object.keys(options.handlers) as AccommodationOperation[];
  return async (request: Request): Promise<Response> => {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === connectorWorkerManifestPath) {
      return Response.json({
        protocolVersion: CONNECTOR_WORKER_PROTOCOL_VERSION,
        providerKey: options.providerKey,
        displayName: options.displayName,
        categories: ["accommodation"],
        ...(options.registration
          ? {
              registration: {
                ...options.registration,
                key: options.providerKey,
                displayName: options.displayName ?? options.providerKey,
                categoryCoverage: ["accommodation"],
              },
            }
          : {}),
        capabilities: [
          ...operations,
          ...(options.validateCredentials ? ["validateCredentials"] : []),
          "health",
        ],
      });
    }
    const operation = operations.find(
      (op) => connectorWorkerOperationPaths[op] === path,
    );
    const credentialValidation =
      path === "/validate-credentials" && options.validateCredentials;
    if (
      request.method !== "POST" ||
      (!operation && path !== "/health" && !credentialValidation)
    )
      return Response.json(
        {
          ok: false,
          error: {
            code: "operation_not_supported",
            message: "Operation not supported",
          },
        },
        { status: 404 },
      );
    if (Number(request.headers.get("content-length") ?? 0) > 262144)
      return new Response(null, { status: 413 });
    const body = await request.text();
    if (body.length > 262144) return new Response(null, { status: 413 });
    if (
      !options.signingSecret ||
      !(await verifyConnectorSignature(request, body, options.signingSecret))
    )
      return Response.json(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Invalid connector signature",
          },
        },
        { status: 401 },
      );
    if (credentialValidation) {
      try {
        const envelope = z
          .object({
            protocolVersion: z.enum(["2026-05-28", "2026-08-04", "2026-08-17"]),
            operation: z.literal("validateCredentials"),
            context: z
              .object({
                connectionId: z.string(),
                connection: z.object({
                  providerKey: z.literal(options.providerKey),
                }),
                credentials: z.record(z.string(), z.string()).optional(),
              })
              .passthrough(),
            input: z.object({}),
          })
          .parse(JSON.parse(body));
        const result = await credentialValidation(
          envelope.context as ConnectorWorkerContext,
        );
        return Response.json({
          ok: true,
          data: z
            .object({
              allowedMarkets: z.array(z.string()).optional(),
              scope: z.record(z.string(), z.unknown()).optional(),
            })
            .parse(result),
        });
      } catch (error) {
        const code =
          error instanceof AccommodationConnectorError
            ? error.code
            : "invalid_credentials";
        return Response.json(
          {
            ok: false,
            error: { code, message: "Connector credential validation failed" },
          },
          { status: 400 },
        );
      }
    }
    if (!operation) return Response.json({ ok: true, data: { status: "ok" } });
    try {
      const envelope = z
        .object({
          protocolVersion: z.enum(["2026-05-28", "2026-08-04", "2026-08-17"]),
          operation: z.literal(operation),
          context: z
            .object({
              connectionId: z.string().min(1),
              connection: z
                .object({ providerKey: z.string() })
                .passthrough()
                .optional(),
            })
            .passthrough(),
          input: accommodationOperations[operation].input,
        })
        .parse(JSON.parse(body));
      if (
        envelope.context.connectionId !== envelope.input.connectionId ||
        (envelope.context.connection &&
          envelope.context.connection.providerKey !== options.providerKey)
      )
        throw new AccommodationConnectorError(
          "invalid_context",
          "Connection context mismatch",
        );
      // The operation table validates the union before dispatch. Each public
      // handler retains its operation-specific input/output types.
      const handler = options.handlers[operation] as (
        context: ConnectorWorkerContext,
        input: unknown,
      ) => Promise<unknown>;
      const result = await handler(
        envelope.context as ConnectorWorkerContext,
        envelope.input,
      );
      const output =
        accommodationOperations[operation].output.safeParse(result);
      if (!output.success)
        return Response.json(
          {
            ok: false,
            error: {
              code: "invalid_connector_response",
              message:
                "Connector response does not satisfy the accommodation contract",
            },
          },
          { status: 502 },
        );
      return Response.json({ ok: true, data: output.data ?? null });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        return Response.json(
          {
            ok: false,
            error: {
              code: "invalid_payload",
              message:
                "Connector payload does not satisfy the accommodation contract",
            },
          },
          { status: 400 },
        );
      if (error instanceof AccommodationConnectorError)
        return Response.json(
          { ok: false, error: { code: error.code, message: error.message } },
          { status: 409 },
        );
      return Response.json(
        {
          ok: false,
          error: {
            code: "connector_failed",
            message: "Connector operation failed",
          },
        },
        { status: 502 },
      );
    }
  };
}
