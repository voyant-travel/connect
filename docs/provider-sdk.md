# Provider SDK

`@voyant-travel/connect-provider-sdk` is for teams building provider integrations
that run inside or alongside Voyant Connect.

It is deliberately small. Provider-specific API clients, scraping logic,
credential exchange, and mapping code belong in connector packages owned by the
provider or by Voyant, not in this SDK package.

## Install

```sh
pnpm add @voyant-travel/connect-provider-sdk
```

## Example

```ts
import {
  defineConnectProvider,
  parseJsonCredentials,
} from "@voyant-travel/connect-provider-sdk";

export const provider = defineConnectProvider({
  key: "example-cruises",
  displayName: "Example Cruises",
  authModel: "bring_your_own_credentials",
  accessModel: "credential_scoped",
  supportedDirections: ["inbound"],
  categoryCoverage: ["cruise"],
  parseCredentials(raw) {
    return parseJsonCredentials(String(raw));
  },
});
```

## Boundary

- Use this package for public provider contracts and helpers.
- Keep provider-specific connector implementations in separate packages/repos
  when maintenance may be handed to the provider.
- Use `@voyant-travel/connect-sdk` when calling Connect APIs as a consumer.
