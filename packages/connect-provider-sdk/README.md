# `@voyantjs/connect-provider-sdk`

Public SDK primitives for building Voyant Connect provider integrations.

Use this package when implementing an integration that runs on the provider side
of Connect. It intentionally does not contain provider-specific API clients.

## Install

```sh
pnpm add @voyantjs/connect-provider-sdk
```

## Usage

```ts
import {
  defineConnectProvider,
  parseJsonCredentials,
} from "@voyantjs/connect-provider-sdk";

const provider = defineConnectProvider({
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

void provider;
```

## Notes

- The package is for provider integration authors, not Connect API consumers.
- API consumers should use `@voyantjs/connect-sdk`.
- The default Connect API base URL used by consumer clients is
  `https://api.voyantjs.com`; provider integrations should receive runtime
  endpoints from their host environment.

For repo-level context, see [../../docs/provider-sdk.md](../../docs/provider-sdk.md).
