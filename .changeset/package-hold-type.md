---
"@voyantjs/connect-sdk": minor
---

Add the `PackageHold` contract type (+ `PackageHoldStatus`) — the Connect-side hold over a `PackageOffer`, mirroring `StayHold`. Returned by the package lock route; Connect always materialises a hold before confirm (binding `PackageConfirmInput.holdId`).
