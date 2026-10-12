import {
  stayOfferSchema,
  type StayOffer,
  type StaySearchQuery,
} from "./availability-search.js";
import { stayBookingSchema, type StayConfirmInput } from "./bookings.js";
import type { AccommodationHandlers } from "./worker.js";
import type { ConnectorWorkerContext } from "../hosted-worker.js";

/** Run only against disposable inventory: this exercises real reserve/cancel writes. */
export async function runAccommodationConformance(input: {
  handlers: AccommodationHandlers;
  context: ConnectorWorkerContext;
  query: StaySearchQuery;
  select: (offers: StayOffer[]) => StayOffer;
  guests: Omit<StayConfirmInput, "holdId">;
}): Promise<{ bookingId: string; reference: string }> {
  const connectionId = input.context.connectionId;
  const offer = stayOfferSchema.parse(
    input.select(
      await input.handlers.searchStays(input.context, {
        connectionId,
        query: input.query,
      }),
    ),
  );
  const quoted = await input.handlers.quoteStay(input.context, {
    connectionId,
    offer,
  });
  if (!quoted)
    throw new Error("Conformance: selected stay could not be quoted");
  const held = await input.handlers.lockStay(input.context, {
    connectionId,
    offer: quoted,
  });
  if (!held?.providerHoldRef)
    throw new Error("Conformance: fixture requires a native hold");
  const request = {
    connectionId,
    offer: quoted,
    providerHoldRef: held.providerHoldRef,
    input: { ...input.guests, holdId: held.providerHoldRef },
  };
  const context = {
    ...input.context,
    idempotencyKey: `conformance:${held.providerHoldRef}`,
  };
  const booking = stayBookingSchema.parse(
    await input.handlers.confirmStay(context, request),
  );
  let validationError: unknown;
  let cancelled: Awaited<ReturnType<AccommodationHandlers["cancelStay"]>>;
  try {
    const replay = await input.handlers.confirmStay(context, request);
    if (replay.id !== booking.id)
      throw new Error(
        "Conformance: duplicate confirmation created another booking",
      );
    if (
      booking.totals.total.amountMinor !== quoted.totals.total.amountMinor ||
      booking.totals.total.currency !== quoted.totals.total.currency
    )
      throw new Error("Conformance: confirmed price differs from quote");
    if (
      booking.rooms.some(
        (room, i) =>
          room.roomTypeId !== quoted.rooms[i]?.roomTypeId ||
          room.ratePlanId !== quoted.rooms[i]?.ratePlanId,
      )
    )
      throw new Error("Conformance: confirmed room/rate differs from quote");
    const read = await input.handlers.getStayBooking(context, {
      connectionId,
      externalReference: booking.externalReference ?? booking.id,
    });
    if (read?.id !== booking.id)
      throw new Error("Conformance: booking cannot be reconciled");
  } catch (error) {
    validationError = error;
  } finally {
    cancelled = await input.handlers.cancelStay(context, {
      connectionId,
      booking,
    });
  }
  if (validationError) throw validationError;
  if (cancelled.status !== "cancelled")
    throw new Error("Conformance: cancellation did not complete");
  if (!booking.externalReference)
    throw new Error(
      "Conformance: booking needs an externalReference for reconciliation",
    );
  // Connect replaces the provider booking ID with its own ID. Check replay
  // after native cleanup so a broken reference lookup leaves no reservation.
  const cancellationReplay = await input.handlers.cancelStay(context, {
    connectionId,
    booking: { ...booking, id: `cssb_conformance_${booking.id}` },
  });
  if (
    cancellationReplay.status !== "cancelled" ||
    cancellationReplay.externalReference !== booking.externalReference
  )
    throw new Error(
      "Conformance: cancellation replay lost the provider reference",
    );
  return { bookingId: booking.id, reference: booking.reference };
}
