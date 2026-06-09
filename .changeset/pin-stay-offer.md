---
"@voyantjs/connect-adapter": patch
---

`liveResolve` for stays now pins the resolved offer to a caller-supplied `roomTypeId` / `ratePlanId` (or `board`) when present. A date with several boards/rates returns several offers per accommodation; the resolver previously kept whichever offer came last in the search response, so the exact board/room the operator clicked wasn't guaranteed to be the one quoted. Selection is now deterministic per accommodation — the pinned offer when matched, otherwise the first candidate. Absent a pin, behaviour is unchanged (the stay `offer.id` is a per-search token and can't pin across the re-resolve).
