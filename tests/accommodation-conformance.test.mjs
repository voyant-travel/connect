import test from "node:test";
import assert from "node:assert/strict";
import { runAccommodationConformance } from "../packages/connect-provider-sdk/dist/accommodations/index.js";

function fixture({
  byBookingId = false,
  externalReference = "pms-booking",
} = {}) {
  const money = (amountMinor) => ({
    amountMinor,
    currency: "JPY",
    currencyPrecision: 0,
  });
  const totals = {
    subtotal: money(50000),
    taxes: money(0),
    fees: money(0),
    total: money(50000),
  };
  const policy = { deadlines: [] };
  const occupancy = { adults: 2, children: 1 };
  const room = {
    ...totals,
    roomTypeId: "family",
    ratePlanId: "flexible",
    occupancy,
    nights: 2,
    nightlyBreakdown: ["2027-01-20", "2027-01-21"].map((date) => ({
      date,
      amount: money(25000),
    })),
    cancellationPolicy: policy,
  };
  const offer = {
    id: "offer",
    connectionId: "conn_test",
    accommodationId: "hotel",
    rooms: [room],
    totals,
    expiresAt: "2027-01-20T00:00:00Z",
  };
  const guests = [
    { type: "adult", firstName: "Demo", lastName: "Guest" },
    { type: "adult", firstName: "Second", lastName: "Guest" },
    { type: "child", firstName: "Child", lastName: "Guest" },
  ];
  const booking = {
    id: "pms-booking",
    externalReference,
    connectionId: "conn_test",
    accommodationId: "hotel",
    status: "confirmed",
    reference: "DEMO",
    rooms: [
      {
        roomTypeId: "family",
        ratePlanId: "flexible",
        checkIn: "2027-01-20",
        checkOut: "2027-01-22",
        occupancy,
        guests,
        totals: room,
      },
    ],
    leadGuest: guests[0],
    contact: { email: "demo@example.invalid" },
    totals,
    cancellationPolicy: policy,
    createdAt: "2026-10-12T00:00:00Z",
    updatedAt: "2026-10-12T00:00:00Z",
  };
  const cancellationInputs = [];
  let backendStatus = "confirmed";
  return {
    booking,
    cancellationInputs,
    backendStatus: () => backendStatus,
    input: {
      context: { connectionId: "conn_test", environment: "sandbox" },
      query: {
        accommodationIds: ["hotel"],
        checkIn: "2027-01-20",
        checkOut: "2027-01-22",
        rooms: [occupancy],
      },
      select: (offers) => offers[0],
      guests: {
        leadGuest: guests[0],
        contact: booking.contact,
        guestsByRoom: [guests],
      },
      handlers: {
        async searchStays() {
          return [offer];
        },
        async quoteStay() {
          return offer;
        },
        async lockStay() {
          return { providerHoldRef: "pms-hold" };
        },
        async confirmStay() {
          return booking;
        },
        async getStayBooking() {
          return booking;
        },
        async cancelStay(_, { booking: input }) {
          cancellationInputs.push(input);
          assert.equal(
            byBookingId ? input.id : (input.externalReference ?? input.id),
            "pms-booking",
          );
          backendStatus = "cancelled";
          return { ...booking, status: "cancelled" };
        },
      },
    },
  };
}

test("checks cancellation replay with a distinct Connect booking ID", async () => {
  const f = fixture();
  await runAccommodationConformance(f.input);
  assert.equal(f.cancellationInputs.length, 2);
  assert.notEqual(f.cancellationInputs[1].id, "pms-booking");
  assert.equal(f.cancellationInputs[1].externalReference, "pms-booking");
  assert.equal(f.backendStatus(), "cancelled");
});

test("rejects PMS lookup by Connect booking ID after cleaning up native inventory", async () => {
  const f = fixture({ byBookingId: true });
  await assert.rejects(runAccommodationConformance(f.input));
  assert.equal(f.backendStatus(), "cancelled");
});

test("requires the reconciliation reference after native cancellation cleanup", async () => {
  const f = fixture();
  delete f.booking.externalReference;
  await assert.rejects(
    runAccommodationConformance(f.input),
    /externalReference/,
  );
  assert.equal(f.backendStatus(), "cancelled");
});
