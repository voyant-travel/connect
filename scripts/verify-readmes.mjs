import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assertIncludes(source, needle, label) {
  assert.ok(
    source.includes(needle),
    `${label} is missing required text:\n${needle}`,
  );
}

function verifyRootReadme() {
  const source = readFile("README.md");

  const required = [
    "# Voyant Connect SDK",
    "`@voyantjs/connect-sdk`",
    "`@voyantjs/connect-adapter`",
    "`@voyantjs/connect-provider-sdk`",
    "`@voyantjs/connect-cruises`",
    "`@voyant-sdk/sdk-core`",
    "pnpm verify",
    "pnpm release",
    "pnpm sync:contracts",
    "pnpm verify:client-route-coverage",
    "pnpm verify:api-parity",
    "pnpm verify:package-artifacts",
    "pnpm verify:package-manifests",
    "pnpm verify:readmes",
    "[Connect SDK](./docs/connect.md)",
    "[Connect Adapter](./docs/connect-adapter.md)",
    "[Provider SDK](./docs/provider-sdk.md)",
    "[Connect Cruises](./docs/connect-cruises.md)",
  ];

  for (const needle of required) {
    assertIncludes(source, needle, "README.md");
  }
}

function verifyPackageReadme({
  path: relativePath,
  packageName,
  factoryName,
  docLink,
  envVar,
}) {
  const source = readFile(relativePath);

  const required = [
    `# \`${packageName}\``,
    `pnpm add ${packageName}`,
    factoryName,
    envVar,
    "https://api.voyantjs.com",
    docLink,
  ];

  for (const needle of required) {
    assertIncludes(source, needle, relativePath);
  }
}

function verifyPublishingDoc() {
  const source = readFile("docs/publishing.md");

  const required = [
    "## Pre-publish checks",
    "`pnpm sync:contracts`",
    "`pnpm verify`",
    "`pnpm release`",
    "`pnpm verify:client-route-coverage`",
    "`pnpm verify:api-parity`",
    "`pnpm verify:package-artifacts`",
    "`pnpm verify:package-manifests`",
    "`pnpm verify:readmes`",
    "`changeset publish`",
    "`NPM_TOKEN`",
  ];

  for (const needle of required) {
    assertIncludes(source, needle, "docs/publishing.md");
  }
}

function verifyDevelopmentDoc() {
  const source = readFile("docs/development.md");

  const required = [
    "# Development",
    "pnpm check-types",
    "pnpm lint",
    "pnpm build",
    "pnpm sync:contracts",
    "pnpm verify:client-route-coverage",
    "pnpm verify:api-parity",
    "pnpm verify:package-artifacts",
    "pnpm verify:package-manifests",
    "pnpm verify:readmes",
    "pnpm verify",
  ];

  for (const needle of required) {
    assertIncludes(source, needle, "docs/development.md");
  }
}

function verifyContractsDoc() {
  const source = readFile("docs/contracts.md");

  const required = [
    "# Contracts",
    "pnpm sync:contracts",
    "generated/public-routes.json",
    "`voyant-cloud`",
    "`connect-sdk`",
  ];

  for (const needle of required) {
    assertIncludes(source, needle, "docs/contracts.md");
  }
}

function extractTypeScriptSnippets(relativePath) {
  const source = readFile(relativePath);
  const snippets = [...source.matchAll(/```ts\n([\s\S]*?)```/g)].map(
    ([, snippet]) => snippet.trim(),
  );

  assert.ok(
    snippets.length > 0,
    `${relativePath} does not contain any TypeScript examples to verify.`,
  );

  return snippets;
}

function normalizeSnippet(source) {
  return source
    .replaceAll("process.env.VOYANT_API_KEY!", '"connect_key"')
    .replaceAll("process.env.VOYANT_CONNECT_CLIENT_ID!", '"client_id"')
    .replaceAll("process.env.VOYANT_CONNECT_CLIENT_SECRET!", '"client_secret"');
}

function verifyMarkdownExamplesTypecheck() {
  const tempDir = mkdtempSync(path.join(tmpdir(), "voyant-sdk-readmes-"));

  try {
    const nodeModulesDir = path.join(tempDir, "node_modules");
    const voyantJsDir = path.join(nodeModulesDir, "@voyantjs");

    mkdirSync(nodeModulesDir, { recursive: true });
    mkdirSync(voyantJsDir, { recursive: true });
    symlinkSync(
      path.join(repoRoot, "packages", "connect-sdk"),
      path.join(voyantJsDir, "connect-sdk"),
    );
    symlinkSync(
      path.join(repoRoot, "packages", "connect-adapter"),
      path.join(voyantJsDir, "connect-adapter"),
    );
    mkdirSync(path.join(voyantJsDir, "catalog"), { recursive: true });
    writeFileSync(
      path.join(voyantJsDir, "catalog", "package.json"),
      JSON.stringify(
        {
          name: "@voyantjs/catalog",
          type: "module",
          exports: {
            "./booking-engine": "./booking-engine.d.ts",
          },
        },
        null,
        2,
      ),
    );
    writeFileSync(
      path.join(voyantJsDir, "catalog", "booking-engine.d.ts"),
      [
        "export interface SourceAdapterRegistry {",
        "  register(connectionId: string, adapter: unknown): void;",
        "}",
        "export function createSourceAdapterRegistry(): SourceAdapterRegistry;",
        "",
      ].join("\n"),
    );
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "voyant-sdk-readme-snippets",
          private: true,
          type: "module",
        },
        null,
        2,
      ),
    );
    writeFileSync(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            noEmit: true,
            strict: true,
            target: "ES2022",
          },
          include: ["*.ts"],
        },
        null,
        2,
      ),
    );

    const snippetSources = [
      "packages/connect-sdk/README.md",
      "packages/connect-adapter/README.md",
      "docs/connect.md",
      "docs/connect-adapter.md",
    ].flatMap((relativePath) =>
      extractTypeScriptSnippets(relativePath).map((snippet, index) => ({
        filename: `snippet-${path
          .basename(relativePath, ".md")
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()}-${index + 1}.ts`,
        source: `// ${relativePath} snippet ${index + 1}\n${normalizeSnippet(snippet)}`,
      })),
    );

    for (const snippet of snippetSources) {
      writeFileSync(path.join(tempDir, snippet.filename), snippet.source);
    }

    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"),
        "-p",
        tempDir,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

verifyRootReadme();
verifyPackageReadme({
  path: "packages/connect-sdk/README.md",
  packageName: "@voyantjs/connect-sdk",
  factoryName: "createVoyantConnectClient",
  docLink: "[../../docs/connect.md](../../docs/connect.md)",
  envVar: "VOYANT_API_KEY",
});
verifyPackageReadme({
  path: "packages/connect-adapter/README.md",
  packageName: "@voyantjs/connect-adapter",
  factoryName: "createVoyantConnectSourceAdapter",
  docLink: "[../../docs/connect-adapter.md](../../docs/connect-adapter.md)",
  envVar: "VOYANT_API_KEY",
});
verifyPackageReadme({
  path: "packages/connect-provider-sdk/README.md",
  packageName: "@voyantjs/connect-provider-sdk",
  factoryName: "defineConnectProvider",
  docLink: "[../../docs/provider-sdk.md](../../docs/provider-sdk.md)",
  envVar: "https://api.voyantjs.com",
});
verifyPackageReadme({
  path: "packages/connect-cruises/README.md",
  packageName: "@voyantjs/connect-cruises",
  factoryName: "createConnectCruiseAdapter",
  docLink: "[../../docs/connect-cruises.md](../../docs/connect-cruises.md)",
  envVar: "VOYANT_API_KEY",
});
verifyPublishingDoc();
verifyDevelopmentDoc();
verifyContractsDoc();
verifyMarkdownExamplesTypecheck();

console.log("README and docs verification passed.");
