export interface DocSource {
  name: string;
  repo: string;
  docsPath: string;
  format: "markdown" | "mdx" | "rst" | "openapi";
  category:
    | "infrastructure"
    | "smart-contracts"
    | "sdk"
    | "standards"
    | "governance"
    | "scaling"
    | "testing";
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
    // FIX: docsPath narrowed — main docs in root README + API specs in docs/api/
    name: "Kupo",
    repo: "https://github.com/CardanoSolutions/kupo.git",
    docsPath: ".",
    format: "markdown",
    category: "infrastructure",
    priority: "high",
    globPatterns: ["README.md", "docs/api/**/*.yaml", "docs/api/**/*.yml"],
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
  {
    name: "Mithril",
    repo: "https://github.com/input-output-hk/mithril.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Oura",
    repo: "https://github.com/txpipe/oura.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Pallas",
    repo: "https://github.com/txpipe/pallas.git",
    docsPath: ".",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
    globPatterns: ["README.md", "**/README.md"],
  },
  {
    name: "Cardano Wallet",
    repo: "https://github.com/cardano-foundation/cardano-wallet.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
    globPatterns: ["**/*.md"],
  },
  {
    name: "Dolos",
    repo: "https://github.com/txpipe/dolos.git",
    docsPath: "docs",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Yaci Store",
    repo: "https://github.com/bloxbean/yaci-store.git",
    docsPath: ".",
    format: "markdown",
    category: "infrastructure",
    priority: "medium",
    globPatterns: ["README.md", "docs/**/*.md"],
  },

  // --- Smart Contract Languages ---
  {
    name: "Aiken",
    repo: "https://github.com/aiken-lang/site.git",
    docsPath: "src/pages",
    format: "mdx",
    category: "smart-contracts",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Aiken Stdlib",
    repo: "https://github.com/aiken-lang/stdlib.git",
    docsPath: "lib",
    format: "markdown",
    category: "smart-contracts",
    priority: "high",
    globPatterns: ["**/*.ak"],
  },
  {
    name: "Aiken Examples",
    repo: "https://github.com/aiken-lang/aiken.git",
    docsPath: "examples",
    format: "markdown",
    category: "smart-contracts",
    priority: "high",
    globPatterns: ["**/*.ak", "**/*.md", "**/aiken.toml"],
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
    // FIX: docsPath changed to root — docs/ is pdoc HTML output, not useful markdown
    name: "OpShin",
    repo: "https://github.com/opshin/opshin.git",
    docsPath: ".",
    format: "markdown",
    category: "smart-contracts",
    priority: "medium",
    globPatterns: ["README.md", "ARCHITECTURE.md"],
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

  // --- Off-chain SDKs & Frameworks ---
  {
    // FIX: apps/docs/ is 404 — repo restructured, packages/ has current content
    name: "Mesh SDK",
    repo: "https://github.com/MeshJS/mesh.git",
    docsPath: ".",
    format: "mdx",
    category: "sdk",
    priority: "high",
    globPatterns: [
      "README.md",
      "packages/**/README.md",
      "packages/**/*.md",
      "packages/**/*.mdx",
    ],
  },
  {
    name: "Lucid Evolution",
    repo: "https://github.com/Anastasia-Labs/lucid-evolution.git",
    docsPath: "docs",
    format: "mdx",
    category: "sdk",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Lucid Evolution Packages",
    repo: "https://github.com/Anastasia-Labs/lucid-evolution.git",
    docsPath: "packages",
    format: "markdown",
    category: "sdk",
    priority: "high",
    globPatterns: ["**/README.md", "**/*.md"],
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
    name: "cardano-client-lib",
    repo: "https://github.com/bloxbean/cardano-client-lib.git",
    docsPath: ".",
    format: "markdown",
    category: "sdk",
    priority: "medium",
    globPatterns: ["README.md", "docs/**/*.md", "examples/**/*.md"],
  },
  {
    name: "Cardano Serialization Lib",
    repo: "https://github.com/Emurgo/cardano-serialization-lib.git",
    docsPath: ".",
    format: "markdown",
    category: "sdk",
    priority: "medium",
    globPatterns: ["README.md", "doc/**/*.md", "examples/**/*.md"],
  },

  // --- Testing & DevNets ---
  {
    name: "Yaci DevKit",
    repo: "https://github.com/bloxbean/yaci-devkit.git",
    docsPath: "docs",
    format: "markdown",
    category: "testing",
    priority: "high",
  },
  {
    name: "Plutip",
    repo: "https://github.com/mlabs-haskell/plutip.git",
    docsPath: ".",
    format: "markdown",
    category: "testing",
    priority: "medium",
    globPatterns: ["README.md", "docs/**/*.md", "local-cluster/**/*.md"],
  },

  // --- Governance (Conway Era) ---
  {
    name: "GovTool",
    repo: "https://github.com/IntersectMBO/govtool.git",
    docsPath: "docs",
    format: "markdown",
    category: "governance",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "SanchoNet",
    repo: "https://github.com/input-output-hk/sanchonet.git",
    docsPath: "docs",
    format: "markdown",
    category: "governance",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Intersect Docs",
    repo: "https://github.com/IntersectMBO/intersect-documentation.git",
    docsPath: "docs",
    format: "markdown",
    category: "governance",
    priority: "medium",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },

  // --- Scaling / Layer 2 ---
  {
    name: "Hydra",
    repo: "https://github.com/cardano-scaling/hydra.git",
    docsPath: "docs",
    format: "markdown",
    category: "scaling",
    priority: "high",
    globPatterns: ["**/*.md", "**/*.mdx"],
  },
  {
    name: "Ouroboros Leios",
    repo: "https://github.com/input-output-hk/ouroboros-leios.git",
    docsPath: "docs",
    format: "markdown",
    category: "scaling",
    priority: "medium",
    globPatterns: ["**/*.md"],
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
