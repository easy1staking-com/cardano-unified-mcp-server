export interface DocSource {
  name: string;
  repo: string;
  docsPath: string;
  format: "markdown" | "mdx" | "rst" | "openapi";
  category: "infrastructure" | "smart-contracts" | "sdk" | "standards";
  priority: "high" | "medium" | "low";
  branch?: string;
  globPatterns?: string[];
}

export const DOC_SOURCES: DocSource[] = [
  // --- Core Infrastructure ---
  {
    name: "Ogmios",
    repo: "https://github.com/cardanosolutions/ogmios.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "high",
  },
  {
    name: "Kupo",
    repo: "https://github.com/CardanoSolutions/kupo.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.yaml", "**/*.yml"],
  },
  {
    name: "Blockfrost OpenAPI",
    repo: "https://github.com/blockfrost/openapi.git",
    docsPath: ".",
    format: "openapi",
    category: "infrastructure",
    priority: "high",
    globPatterns: ["**/*.yaml"],
  },
  {
    name: "Cardano Node Wiki",
    repo: "https://github.com/input-output-hk/cardano-node-wiki.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
  },
  {
    name: "DB-Sync",
    repo: "https://github.com/IntersectMBO/cardano-db-sync.git",
    docsPath: "doc",
    format: "markdown",
    category: "infrastructure",
    priority: "low",
  },

  // --- Smart Contract Languages ---
  {
    name: "Aiken",
    repo: "https://github.com/aiken-lang/aiken.git",
    docsPath: "docs",
    format: "mdx",
    category: "smart-contracts",
    priority: "high",
  },
  {
    name: "Plutus",
    repo: "https://github.com/IntersectMBO/plutus.git",
    docsPath: "doc",
    format: "markdown",
    category: "smart-contracts",
    priority: "medium",
  },
  {
    name: "OpShin",
    repo: "https://github.com/opshin/opshin.git",
    docsPath: "docs",
    format: "markdown",
    category: "smart-contracts",
    priority: "medium",
    globPatterns: ["**/*.md", "ARCHITECTURE.md", "README.md"],
  },
  {
    name: "Helios",
    repo: "https://github.com/Hyperion-BT/helios-book.git",
    docsPath: "src",
    format: "markdown",
    category: "smart-contracts",
    priority: "low",
  },
  {
    name: "Marlowe",
    repo: "https://github.com/input-output-hk/marlowe-doc.git",
    docsPath: "docs",
    format: "markdown",
    category: "smart-contracts",
    priority: "low",
  },

  // --- Off-chain SDKs & Frameworks ---
  {
    name: "Mesh SDK",
    repo: "https://github.com/MeshJS/mesh.git",
    docsPath: "apps/docs",
    format: "mdx",
    category: "sdk",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx", "**/*.tsx"],
  },
  {
    name: "Evolution SDK",
    repo: "https://github.com/IntersectMBO/evolution-sdk.git",
    docsPath: "docs/content/docs",
    format: "mdx",
    category: "sdk",
    priority: "high",
  },
  {
    name: "cardano-js-sdk",
    repo: "https://github.com/input-output-hk/cardano-js-sdk.git",
    docsPath: ".",
    format: "markdown",
    category: "sdk",
    priority: "medium",
    globPatterns: ["**/README.md", "GETTING_STARTED.md"],
  },
  {
    name: "PyCardano",
    repo: "https://github.com/Python-Cardano/pycardano.git",
    docsPath: "docs/source",
    format: "rst",
    category: "sdk",
    priority: "medium",
  },
  {
    name: "Yaci DevKit",
    repo: "https://github.com/bloxbean/yaci-devkit.git",
    docsPath: "docs",
    format: "markdown",
    category: "sdk",
    priority: "medium",
  },

  // --- CIP-113 Programmable Tokens (reference implementation) ---
  {
    name: "CIP-113 Programmable Tokens",
    repo: "https://github.com/cardano-foundation/cip113-programmable-tokens.git",
    docsPath: ".",
    format: "markdown",
    category: "smart-contracts",
    priority: "high",
    globPatterns: [
      "README.md",
      "RFI-REVIEW-SUMMARY.md",
      "src/programmable-tokens-onchain-aiken/README.md",
      "src/programmable-tokens-onchain-aiken/documentation/**/*.md",
      "src/programmable-tokens-offchain-java/README.md",
    ],
  },

  // --- Standards & Portals ---
  {
    name: "CIPs",
    repo: "https://github.com/cardano-foundation/CIPs.git",
    docsPath: ".",
    format: "markdown",
    category: "standards",
    priority: "high",
    globPatterns: ["CIP-*/README.md", "CIP-*/**/*.md", "CPS-*/README.md"],
  },
  {
    name: "Developer Portal",
    repo: "https://github.com/cardano-foundation/developer-portal.git",
    docsPath: "docs",
    format: "markdown",
    category: "standards",
    priority: "high",
  },
  {
    name: "Cardano Docs",
    repo: "https://github.com/input-output-hk/cardano-documentation.git",
    docsPath: "docs",
    format: "markdown",
    category: "standards",
    priority: "high",
  },
];
