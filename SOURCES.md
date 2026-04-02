# Cardano Unified MCP Server - Source Index

> This index is used to periodically rebuild the documentation and tool ingestion pipeline.
> Last updated: 2026-04-02

## Scope

**IN:** Everything needed to BUILD on Cardano — docs, SDKs, smart contract languages, off-chain tooling, standards, governance, scaling/L2, testing.
**OUT:** Protocol-specific DeFi (Indigo), anything requiring local software (Cardano Node MCP, Yaci DevKit runtime), node runtime operations.

## Existing MCP Servers (reference)

| Project | URL | Status | Notes |
|---------|-----|--------|-------|
| Yaci DevKit MCP | https://github.com/bloxbean/yaci-devkit (PR #146 merged) | **Future proxy** | 5 tools, devnet lifecycle — proxy when user runs local devnet |
| Flux Agent Skills | https://github.com/Flux-Point-Studios/cardano-agent-skills | **Reference only** | Not an MCP server, 25 skill definition files |
| Indigo MCP | https://github.com/IndigoProtocol/indigo-mcp | **Out of scope** | Protocol-specific DeFi |
| Koios MCP | https://github.com/michaeljfazio/koios-mcp | **Out of scope** | Ecosystem uses Kupo/Ogmios/Blockfrost instead |
| Cardano Node MCP | https://github.com/michaeljfazio/cardano-node-mcp | **Out of scope** | Requires local node |
| Mesh Skills | https://x.com/jinglescode/status/2033524038535163966 | **Reference only** | AI skills for MeshSDK |

---

## Indexed Sources

### Core Infrastructure

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| Ogmios | https://github.com/cardanosolutions/ogmios | Markdown | **High** | Indexed |
| Kupo | https://github.com/CardanoSolutions/kupo | OpenAPI + Markdown | **High** | Indexed |
| Blockfrost OpenAPI | https://github.com/blockfrost/openapi | OpenAPI YAML | **High** | Indexed |
| Mithril | https://github.com/input-output-hk/mithril | Markdown/MDX | **High** | Indexed |
| Cardano Node Wiki | https://github.com/input-output-hk/cardano-node-wiki | Markdown | Medium | Indexed |
| Cardano Wallet | https://github.com/cardano-foundation/cardano-wallet | Markdown | Medium | Indexed |
| Oura | https://github.com/txpipe/oura | Markdown/MDX | Medium | Indexed |
| Pallas | https://github.com/txpipe/pallas | Markdown | Medium | Indexed |
| Dolos | https://github.com/txpipe/dolos | Markdown/MDX | Medium | Indexed |
| Yaci Store | https://github.com/bloxbean/yaci-store | Markdown | Medium | Indexed |
| Koios | https://github.com/cardano-community/koios-artifacts | OpenAPI + Markdown | Medium | Indexed |
| Cardano GraphQL | https://github.com/cardano-foundation/cardano-graphql | Markdown | Medium | Indexed |
| DB-Sync | https://github.com/IntersectMBO/cardano-db-sync | Markdown | Low | Indexed |

### Smart Contract Languages

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| Aiken (site) | https://github.com/aiken-lang/site | MDX | **High** | Indexed |
| Aiken Stdlib | https://github.com/aiken-lang/stdlib | Aiken (.ak) | **High** | Indexed |
| Aiken Examples | https://github.com/aiken-lang/aiken (examples/) | Aiken + Markdown | **High** | Indexed |
| Aiken Design Patterns | https://github.com/Anastasia-Labs/aiken-design-patterns | Aiken + Markdown | **High** | Indexed |
| CIP-113 Programmable Tokens | https://github.com/cardano-foundation/cip113-programmable-tokens | Markdown | Medium | Indexed |
| Plutus | https://github.com/IntersectMBO/plutus | Markdown | Medium | Indexed |
| OpShin | https://github.com/opshin/opshin | Markdown | Medium | Indexed |
| Pebble | https://github.com/HarmonicLabs/pebble | Markdown | Medium | Indexed |
| Plutarch | https://github.com/Plutonomicon/plutarch-plutus | Markdown | Medium | Indexed |
| Plu-ts | https://github.com/HarmonicLabs/plu-ts | Markdown | Medium | Indexed |
| Scalus | https://github.com/scalus3/scalus | Markdown | Medium | Indexed |

### Off-chain SDKs & Frameworks

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| Mesh SDK | https://github.com/MeshJS/mesh | MDX | **High** | Indexed |
| Evolution SDK | https://github.com/IntersectMBO/evolution-sdk (docs/) | MDX | **High** | Indexed |
| Evolution SDK Packages | https://github.com/IntersectMBO/evolution-sdk (packages/) | Markdown | **High** | Indexed |
| cardano-js-sdk | https://github.com/input-output-hk/cardano-js-sdk | Markdown | Medium | Indexed |
| PyCardano | https://github.com/Python-Cardano/pycardano | RST | Medium | Indexed |
| cardano-client-lib | https://github.com/bloxbean/cardano-client-lib | Markdown | Medium | Indexed |
| Cardano Serialization Lib | https://github.com/Emurgo/cardano-serialization-lib | Markdown | Medium | Indexed |
| Buildooor | https://github.com/HarmonicLabs/buildooor | Markdown | Low | Indexed |

### Testing & DevNets

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| Yaci DevKit | https://github.com/bloxbean/yaci-devkit | MDX | **High** | Indexed |

### Governance (Conway Era)

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| GovTool | https://github.com/IntersectMBO/govtool | Markdown/MDX | **High** | Indexed |
| SanchoNet | https://github.com/input-output-hk/sanchonet | Markdown/MDX | **High** | Indexed |

### Scaling / Layer 2

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| Hydra | https://github.com/cardano-scaling/hydra | Markdown/MDX | **High** | Indexed |
| Ouroboros Leios | https://github.com/input-output-hk/ouroboros-leios | Markdown | Medium | Indexed |

### Standards & Portals

| Source | Raw Docs (GitHub) | Format | Priority | Status |
|--------|-------------------|--------|----------|--------|
| CIPs & CPS | https://github.com/cardano-foundation/CIPs | Markdown | **High** | Indexed |
| Developer Portal | https://github.com/cardano-foundation/developer-portal | Markdown | **High** | Indexed |
| Cardano Docs | https://github.com/input-output-hk/cardano-documentation | Markdown | **High** | Indexed |

---

## Not Yet Indexed — Candidates for Future Additions

### Smart Contract Languages
| Tool | Why | Priority |
|------|-----|----------|
| Helios | DSL with JS/TS SDK, browser compilation | Medium |
| Marlowe | Financial contract DSL, community-maintained | Low |
| Stellar Contracts | Higher-level Helios patterns | Low |

### Off-chain SDKs
| Tool | Why | Priority |
|------|-----|----------|
| Lucid Evolution | Production-ready TS tx builder by Anastasia Labs | **High** |
| Blaze SDK | Major TS tx builder by Butane Protocol, rising fast | Medium |
| Atlas (GeniusYield) | Most mature Haskell PAB | Medium |
| Cardano Multiplatform Lib (CML) | dcSpark Rust/WASM foundation | Medium |
| CTL (Cardano Transaction Lib) | PureScript framework (Plutonomicon) | Low |
| Tx-Village (MLabs) | Rust/Haskell, Conway/PlutusV3 | Low |
| Cometa.js / Cometa.py | Zero-dep, high-perf JS/Python | Low |
| cardano-go | Go SDK | Low |

### Infrastructure & Indexers
| Tool | Why | Priority |
|------|-----|----------|
| Scrolls | TxPipe read-optimized chain data | Low |
| Carp | dcSpark modular Postgres indexer | Low |
| Ledger Sync | Cardano Foundation Java indexer | Low |
| gOuroboros | Go Ouroboros protocol (Blink Labs) | Low |

### Governance
| Tool | Why | Priority |
|------|-----|----------|
| Intersect Docs | Governance and ecosystem documentation | Medium |

### Wallet Connectors
| Tool | Why | Priority |
|------|-----|----------|
| Weld | Universal wallet connector by Cardano Forge | Medium |
| Cardano Connect with Wallet | CF React wallet components | Low |

---

## CIP Crawl Notes

The CIPs repo has a nested structure. Each CIP lives in its own directory:
```
CIP-XXXX/
  README.md          <- main proposal
  *.png/svg/etc      <- diagrams
  references/        <- supporting material (some CIPs)
```

Key CIPs to prioritize for developer tooling:
- CIP-0002 (Coin Selection)
- CIP-0025 (NFT Metadata)
- CIP-0030 (dApp-Wallet Web Bridge)
- CIP-0057 (Plutus Smart Contract Blueprints)
- CIP-0068 (Datum Metadata Standard)
- CIP-0095 (Conway Era Wallet - Governance)
- CIP-0116 (Universal JSON Encoding for Data Types)
- CIP-1694 (Voltaire Governance)
- CIP-1852 (HD Wallets for Cardano)

## Note on Evolution SDK

Evolution SDK (`@evolution-sdk/lucid`) is the next-generation Cardano off-chain framework by No Witness Labs, incubated under Intersect. Built on the Effect library for typed functional composition. Replaces Lucid Evolution.

## Rebuild Checklist

When rebuilding the docs index:

1. Clone/pull all GitHub repos listed above (High priority first)
2. Extract markdown/MDX/RST content from each
3. For CIPs: walk nested directories, index README.md + any referenced markdown
4. Parse OpenAPI specs (Blockfrost, Kupo) into doc chunks
5. Chunk documents (aim for ~500-1000 tokens per chunk)
6. Tag chunks with source, category, and priority
7. Generate embeddings
8. Upsert into vector store
9. Update this file with any new sources discovered
