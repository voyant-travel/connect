import test from "node:test";
import assert from "node:assert/strict";
import {
  stayConfirmInputSchema,
  stayOfferSchema,
} from "../packages/connect-provider-sdk/dist/accommodations/index.js";

const money = (amountMinor) => ({
  amountMinor,
  currency: "EUR",
  currencyPrecision: 2,
});

const offer = {
  id: "offer_1",
  connectionId: "conn_1",
  accommodationId: "acc_1",
  rooms: [
    {
      roomTypeId: "DBL",
      ratePlanId: "BB",
      occupancy: { adults: 2 },
      nights: 1,
      nightlyBreakdown: [{ date: "2027-06-01", amount: money(10000) }],
      subtotal: money(10000),
      taxes: money(0),
      fees: money(0),
      total: money(10000),
      cancellationPolicy: { deadlines: [] },
    },
  ],
  totals: {
    subtotal: money(10000),
    taxes: money(0),
    fees: money(0),
    total: money(10000),
  },
  expiresAt: "2027-01-01T00:00:00.000Z",
};

test("an offer keeps the supplier's booking requirements", () => {
  const bookingRequirements = {
    fields: [
      { key: "contact.address.line1", required: true },
      {
        key: "contact.email",
        required: true,
        pattern: "^[^+]+@[^@]+$",
        message: "No plus sign",
      },
    ],
  };
  assert.deepEqual(
    stayOfferSchema.parse({ ...offer, bookingRequirements })
      .bookingRequirements,
    bookingRequirements,
  );
  assert.equal(
    stayOfferSchema.safeParse({
      ...offer,
      bookingRequirements: {
        fields: [{ key: "contact.email", required: true, patternFlags: "g" }],
      },
    }).success,
    false,
  );
});

test("a confirm carries the contact address and the guests' sex", () => {
  const address = {
    line1: "Strada Lipscani",
    streetNumber: "12",
    city: "Bucuresti",
    postalCode: "030031",
    country: "RO",
  };
  const guest = {
    type: "adult",
    firstName: "Ana",
    lastName: "Pop",
    sex: "female",
  };
  const parsed = stayConfirmInputSchema.parse({
    holdId: "hold_1",
    leadGuest: guest,
    contact: { email: "ana@example.test", address },
    guestsByRoom: [[guest]],
  });
  assert.deepEqual(parsed.contact.address, address);
  assert.equal(parsed.leadGuest.sex, "female");
  assert.equal(
    stayConfirmInputSchema.safeParse({
      holdId: "hold_1",
      leadGuest: guest,
      contact: {
        email: "ana@example.test",
        address: { ...address, country: "Romania" },
      },
      guestsByRoom: [[guest]],
    }).success,
    false,
  );
});
