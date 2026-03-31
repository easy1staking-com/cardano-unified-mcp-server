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
