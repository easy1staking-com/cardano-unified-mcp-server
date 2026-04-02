import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VectorDB } from "../db/vectordb.js";

export function registerPrompts(server: McpServer, db: VectorDB) {
  server.prompt(
    "review-contract",
    "Review a Cardano smart contract for common vulnerabilities and best practices",
    {
      language: z
        .string()
        .default("aiken")
        .describe("Smart contract language: aiken, plutus, opshin, helios"),
      code: z.string().describe("The smart contract code to review"),
    },
    async ({ language, code }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are a Cardano smart contract security reviewer specializing in ${language}.

Review the following ${language} smart contract for:
1. **Security vulnerabilities** — double satisfaction, datum hijacking, unbounded computation, missing authorization checks, token value leaks
2. **Best practices** — proper use of validators, redeemer patterns, datum design
3. **Optimization** — script size, execution units, unnecessary computation
4. **Correctness** — logic errors, edge cases, off-by-one errors in value checks

For Aiken specifically, also check:
- Proper use of expect vs when for pattern matching
- Correct validator function signatures
- CIP-57 blueprint compatibility

Contract code:
\`\`\`${language}
${code}
\`\`\`

Provide your review with severity ratings (Critical/High/Medium/Low/Info) for each finding.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "explain-cip",
    "Explain a Cardano Improvement Proposal (CIP) and its implications for developers",
    {
      cip_number: z.string().describe("The CIP number, e.g. '30', '68', '1694'"),
    },
    async ({ cip_number }) => {
      const normalizedNum = cip_number.replace(/^CIP-?/i, "").replace(/^0+/, "");
      const paddedNum = normalizedNum.padStart(4, "0");

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Search the indexed Cardano documentation for CIP-${paddedNum} and explain:

1. **Summary** — What does this CIP propose? (2-3 sentences)
2. **Motivation** — What problem does it solve?
3. **For developers** — How does this affect dApp/smart contract development? What do developers need to know?
4. **Implementation** — What SDKs/tools support it? Code examples if relevant.
5. **Status** — Is it active, draft, or proposed?

Use the search_docs tool to find the CIP content, then provide a clear, developer-focused explanation.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "suggest-tooling",
    "Recommend the best Cardano tools and SDKs for a specific project",
    {
      project_description: z
        .string()
        .describe("Describe what you want to build, e.g. 'NFT marketplace with royalties'"),
      preferred_language: z
        .string()
        .optional()
        .describe("Preferred programming language: typescript, python, haskell, rust, java"),
    },
    async ({ project_description, preferred_language }) => {
      const langHint = preferred_language
        ? `The developer prefers ${preferred_language}.`
        : "No language preference specified — suggest the most practical option.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `A developer wants to build: "${project_description}"
${langHint}

Using the search_docs tool, recommend a complete toolchain:

1. **Smart contract language** — Which on-chain language and why (Aiken, Plutus/Plinth, OpShin, Helios, Plu-ts)
2. **Off-chain SDK** — Which transaction builder (Mesh SDK, Evolution SDK, Blaze, PyCardano, cardano-client-lib, etc.)
3. **Infrastructure** — Which chain query/indexer services (Blockfrost, Ogmios+Kupo, Koios, Maestro)
4. **Testing** — How to test (Yaci DevKit, Aiken tests, Preview testnet)
5. **Wallet integration** — How to connect user wallets (CIP-30)
6. **Relevant CIPs** — Which standards apply (CIP-25, CIP-68, CIP-30, etc.)

For each recommendation, explain why it fits this project and link to the relevant documentation.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "build-transaction",
    "Help build a Cardano transaction step by step",
    {
      sdk: z
        .string()
        .default("mesh")
        .describe("SDK to use: mesh, lucid-evolution, evolution-sdk, pycardano, cardano-client-lib"),
      transaction_type: z
        .string()
        .describe(
          "What kind of transaction: send-ada, mint-nft, mint-token, interact-with-contract, delegate-stake, register-drep, vote"
        ),
    },
    async ({ sdk, transaction_type }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, find documentation for the "${sdk}" SDK and help me build a "${transaction_type}" transaction.

Provide:
1. **Prerequisites** — What packages to install, how to set up the provider/wallet
2. **Step-by-step code** — Complete, working code example
3. **Explanation** — What each step does and why
4. **Common pitfalls** — What can go wrong and how to avoid it
5. **Testing** — How to test this on Preview testnet before mainnet

Use the actual API from the indexed documentation, not from memory. If the SDK docs show a different API than expected, use what the docs say.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "design-token",
    "Design a Cardano native token — fungible, NFT, or programmable (CIP-113)",
    {
      token_type: z
        .string()
        .describe(
          "Type of token: fungible, nft, nft-collection, programmable, rft (rich fungible)"
        ),
      requirements: z
        .string()
        .optional()
        .describe(
          "Special requirements, e.g. 'updatable metadata', 'freeze/seize', 'royalties', 'time-locked minting'"
        ),
    },
    async ({ token_type, requirements }) => {
      const reqHint = requirements
        ? `Additional requirements: ${requirements}`
        : "No special requirements specified.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, help me design a ${token_type} token on Cardano.
${reqHint}

Cover:
1. **Standard to follow** — Which CIP applies (CIP-25, CIP-68 with label 222/333/444, CIP-113 for programmable tokens) and why
2. **Minting policy** — What kind of minting policy (time-locked native script, Plutus/Aiken validator, one-shot)
3. **Metadata** — How to structure metadata (on-chain datum vs transaction metadata), required fields
4. **Architecture** — Reference NFT + user token pattern (CIP-68), registry setup (CIP-113), or simple native mint
5. **Code example** — Minting transaction skeleton with a recommended SDK
6. **Ecosystem compatibility** — How wallets, marketplaces, and DEXes will see this token

Search for the relevant CIP specs and SDK examples from the indexed docs.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "write-validator",
    "Write a Cardano smart contract validator from a specification",
    {
      language: z
        .string()
        .default("aiken")
        .describe("Language: aiken, plutus, opshin, pebble"),
      description: z
        .string()
        .describe(
          "What the validator should do, e.g. 'vesting contract that releases funds after a deadline to a beneficiary'"
        ),
    },
    async ({ language, description }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, look up ${language} documentation, standard library, and examples to write a validator.

Specification: "${description}"

Provide:
1. **Datum type** — What data needs to be stored with each UTxO
2. **Redeemer type** — What actions can be taken (e.g. Claim, Cancel, Update)
3. **Validator logic** — Complete, working ${language} code with comments
4. **Security considerations** — Check for double satisfaction, datum hijacking, missing authorization, value preservation
5. **Off-chain interaction** — How to lock funds to this validator and how to spend from it (transaction skeleton)
6. **Test cases** — Key scenarios to test (happy path, unauthorized access, edge cases)

Use actual ${language} stdlib functions and patterns from the indexed documentation. For Aiken, reference aiken-design-patterns where applicable.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "query-chain",
    "Find the best way to query Cardano blockchain data for your use case",
    {
      data_needed: z
        .string()
        .describe(
          "What data you need, e.g. 'UTxOs at a script address', 'token holders', 'transaction history', 'current protocol parameters'"
        ),
      context: z
        .string()
        .optional()
        .describe("Context: backend-service, dapp-frontend, data-pipeline, one-off-query"),
    },
    async ({ data_needed, context }) => {
      const ctxHint = context
        ? `Context: this is for a ${context}.`
        : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, find the best way to query this data from the Cardano blockchain: "${data_needed}"
${ctxHint}

Compare the available options:
1. **Blockfrost API** — REST endpoints, query parameters, response format
2. **Ogmios** — WebSocket mini-protocols, local state query
3. **Kupo** — UTxO indexing, pattern matching
4. **Koios** — Community API endpoints
5. **Cardano GraphQL** — GraphQL queries
6. **DB-Sync** — Direct SQL queries (if self-hosted)
7. **Oura** — Event pipeline (if streaming/real-time)

For each viable option, show the actual query/endpoint from the indexed docs. Recommend the best fit based on the use case.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "setup-devnet",
    "Set up a local Cardano development environment for testing",
    {
      stack: z
        .string()
        .optional()
        .describe("Your stack: typescript, python, java, haskell, rust"),
    },
    async ({ stack }) => {
      const stackHint = stack
        ? `The developer uses ${stack}.`
        : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, help me set up a local Cardano development environment.
${stackHint}

Cover:
1. **Local devnet** — How to spin up a local Cardano network with Yaci DevKit (Docker commands, configuration)
2. **Pre-funded wallets** — How to get test ADA on the local devnet
3. **Chain indexer** — How to set up Kupo/Ogmios/Blockfrost locally for querying
4. **Smart contract workflow** — How to compile, deploy, and test validators (Aiken build → deploy → test cycle)
5. **Preview/Preprod testnet** — When to move from local devnet to public testnets, how to get testnet ADA
6. **CI integration** — How to run tests in CI with Yaci DevKit

Use the actual documentation from Yaci DevKit and the relevant SDK docs.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "migrate-sdk",
    "Migrate Cardano dApp code between SDKs or from deprecated libraries",
    {
      from_sdk: z
        .string()
        .describe(
          "Current SDK: lucid, lucid-evolution, cardano-serialization-lib, mesh-v1, cardano-cli"
        ),
      to_sdk: z
        .string()
        .default("evolution-sdk")
        .describe("Target SDK: evolution-sdk, mesh, pycardano, cardano-client-lib"),
    },
    async ({ from_sdk, to_sdk }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, help me migrate from "${from_sdk}" to "${to_sdk}".

Provide:
1. **Key API differences** — Side-by-side comparison of common operations (create tx, sign, submit, query UTxOs, interact with scripts)
2. **Migration checklist** — What needs to change: imports, provider setup, wallet handling, datum/redeemer encoding, transaction building
3. **Code examples** — Before/after for the most common patterns: simple payment, minting, script interaction, staking
4. **Breaking changes** — What works differently (e.g. Data encoding, address handling, error handling)
5. **Gotchas** — Common mistakes when migrating

Use the actual API from the indexed docs for both SDKs.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "debug-transaction",
    "Debug a failing Cardano transaction",
    {
      error_message: z
        .string()
        .describe("The error message or failure description"),
      sdk: z
        .string()
        .optional()
        .describe("SDK being used: mesh, evolution-sdk, cardano-cli, pycardano"),
    },
    async ({ error_message, sdk }) => {
      const sdkHint = sdk ? `SDK: ${sdk}` : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Help me debug this Cardano transaction failure.
${sdkHint}

Error: "${error_message}"

Using the search_docs tool, investigate:
1. **Error interpretation** — What does this error mean in the Cardano context?
2. **Common causes** — What typically triggers this error (insufficient ADA, missing collateral, script failure, datum mismatch, redeemer error, budget exceeded, etc.)
3. **Diagnosis steps** — How to narrow down the root cause
4. **Fix** — How to resolve it, with code examples if applicable
5. **Prevention** — How to avoid this in the future

Check the Plutus error codes documentation, SDK-specific error handling docs, and cardano-node wiki for ledger validation rules.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "governance-guide",
    "Guide for participating in Cardano on-chain governance (CIP-1694 / Conway era)",
    {
      role: z
        .string()
        .default("developer")
        .describe("Your role: developer, drep, stake-pool-operator, ada-holder"),
    },
    async ({ role }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Using the search_docs tool, find governance documentation and explain Cardano's on-chain governance for a ${role}:

1. **Overview** — How does CIP-1694 governance work? (DReps, Constitutional Committee, SPOs)
2. **For ${role}s** — What can you do? What actions are available?
3. **Tools** — Which tools to use (GovTool, SanchoNet for testing, cardano-cli governance commands)
4. **SDK integration** — How to build governance actions programmatically (registration, voting, proposals)
5. **Getting started** — Step-by-step guide to participate

Focus on practical, actionable information from the indexed documentation.`,
            },
          },
        ],
      };
    }
  );
}
