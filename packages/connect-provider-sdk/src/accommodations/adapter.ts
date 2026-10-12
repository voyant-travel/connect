import type { StayOffer, StaySearchQuery } from "./availability-search.js";
import type { StayBooking, StayConfirmInput } from "./bookings.js";

export interface AccommodationsAdapter {
  /** Returns offers for a search query. May read cache, call provider live, or both. */
  searchStays(
    connectionId: string,
    query: StaySearchQuery,
  ): Promise<StayOffer[]>;

  /**
   * Optional: revalidate / re-price a specific offer just before lock against
   * the provider's authoritative (live) price - search may have returned a
   * cached price. Returns the re-priced offer to pin on the hold. `null` means
   * the offer is unavailable; a thrown error means the quote failed. Neither
   * outcome may create a Connect hold. Adapters without this capability may
   * still use the unexpired, server-owned search snapshot.
   */
  quoteStay?(connectionId: string, offer: StayOffer): Promise<StayOffer | null>;

  /**
   * Native provider lock if supported. Returns an opaque providerHoldRef +
   * provider-side expiry. Connect always materialises its own `StayHold` row
   * regardless; this is for adapters that need to reserve inventory upstream.
   * Adapters without a native lock primitive return `undefined`.
   */
  lockStay?(
    connectionId: string,
    offer: StayOffer,
  ): Promise<{ providerHoldRef?: string; expiresAt?: string } | undefined>;

  /**
   * Confirm a held offer - writes the booking on the provider side. `options
   * .providerHoldRef` carries the native hold reference returned by `lockStay`
   * (persisted on the Connect `StayHold`) so native-hold providers can complete
   * against the locked cart/session rather than re-quoting.
   */
  confirmStay(
    connectionId: string,
    offer: StayOffer,
    input: StayConfirmInput,
    options?: { providerHoldRef?: string },
  ): Promise<StayBooking>;

  /** Cancel a confirmed booking. */
  cancelStay(
    connectionId: string,
    booking: StayBooking,
    options?: { reason?: string },
  ): Promise<StayBooking>;

  /** Look up a booking on the provider (for reconciliation / status refresh). */
  getStayBooking(
    connectionId: string,
    externalReference: string,
  ): Promise<StayBooking | null>;
}
