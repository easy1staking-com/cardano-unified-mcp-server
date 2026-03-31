# Cardano Unified MCP Server - Source Index

> This index is used to periodically rebuild the documentation and tool ingestion pipeline.
> Last updated: 2026-03-31

## Scope

**IN:** Everything needed to BUILD on Cardano — docs, SDKs, smart contract languages, off-chain tooling, standards, governance, scaling/L2, testing.
**OUT:** Protocol-specific DeFi (Indigo), anything requiring local software (Cardano Node MCP, Yaci DevKit runtime), Koios tools (ecosystem runs on Kupo/Ogmios/Blockfrost).

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

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| Ogmios | https://ogmios.dev | https://github.com/cardanosolutions/ogmios | Hugo/Markdown | **High** | Indexed |
| Kupo | https://cardanosolutions.github.io/kupo | https://github.com/CardanoSolutions/kupo | OpenAPI + Markdown | **High** | Indexed |
| Blockfrost | https://blockfrost.dev | https://github.com/blockfrost/openapi | OpenAPI YAML | **High** | Indexed |
| Mithril | https://mithril.network/doc/ | https://github.com/input-output-hk/mithril | Markdown/MDX | **High** | Indexed |
| Cardano Node | https://cardano-node.cardano.intersectmbo.org/ | https://github.com/input-output-hk/cardano-node-wiki | Markdown | Medium | Indexed |
| Cardano Wallet | https://cardano-foundation.github.io/cardano-wallet/ | https://github.com/cardano-foundation/cardano-wallet | Markdown | Medium | Indexed |
| Oura | https://docs.txpipe.io/oura/v3 | https://github.com/txpipe/oura | Markdown | Medium | Indexed |
| Pallas | https://github.com/txpipe/pallas | https://github.com/txpipe/pallas | Markdown | Medium | Indexed |
| DB-Sync | — | https://github.com/IntersectMBO/cardano-db-sync (doc/) | Markdown | Low | Indexed |
| Dolos | https://github.com/txpipe/dolos | https://github.com/txpipe/dolos | Markdown | Medium | **To add** |
| Yaci Store | https://store.yaci.xyz | https://github.com/bloxbean/yaci-store | Markdown | Medium | **To add** |

### Smart Contract Languages

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| Aiken (site) | https://aiken-lang.org | https://github.com/aiken-lang/site | Nextra/MDX | **High** | Indexed |
| Aiken Stdlib | — | https://github.com/aiken-lang/stdlib (lib/) | Aiken (.ak) | **High** | Indexed |
| Aiken Examples | — | https://github.com/aiken-lang/aiken (examples/) | Aiken + Markdown | **High** | Indexed |
| CIP-113 Programmable Tokens | — | https://github.com/cardano-foundation/cip113-programmable-tokens | Markdown | **High** | Indexed |
| Plutus / Plinth | https://plutus.cardano.intersectmbo.org/docs/ | https://github.com/IntersectMBO/plutus | Markdown | Medium | Indexed |
| OpShin | https://opshin.opshin.dev | https://github.com/opshin/opshin | Markdown | Medium | Indexed |
| Helios | https://helios-lang.io | https://github.com/Hyperion-BT/helios-book | mdBook/Markdown | Low | Indexed |
| Marlowe | https://docs.marlowe.iohk.io | https://github.com/input-output-hk/marlowe-doc | Markdown | Low | Indexed |

### Off-chain SDKs & Frameworks

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| Mesh SDK | https://meshjs.dev | https://github.com/MeshJS/mesh | MDX | **High** | Indexed |
| Lucid Evolution | https://anastasia-labs.github.io/lucid-evolution | https://github.com/Anastasia-Labs/lucid-evolution | MDX | **High** | Indexed |
| Evolution SDK | https://no-witness-labs.github.io/evolution-sdk/ | https://github.com/IntersectMBO/evolution-sdk | Fumadocs/MDX | **High** | Indexed |
| cardano-js-sdk | https://input-output-hk.github.io/cardano-js-sdk/ | https://github.com/input-output-hk/cardano-js-sdk | Markdown | Medium | Indexed |
| PyCardano | https://pycardano.readthedocs.io | https://github.com/Python-Cardano/pycardano | Sphinx/RST | Medium | Indexed |
| cardano-client-lib | https://cardano-client.dev/ | https://github.com/bloxbean/cardano-client-lib | Markdown | Medium | Indexed |
| Cardano Serialization Lib | — | https://github.com/Emurgo/cardano-serialization-lib | Markdown | Medium | Indexed |

### Testing & DevNets

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| Yaci DevKit | https://devkit.yaci.xyz | https://github.com/bloxbean/yaci-devkit | Markdown | **High** | Indexed (recategorize) |
| Plutip | — | https://github.com/mlabs-haskell/plutip | Markdown | Medium | **To add** |

### Governance (Conway Era)

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| GovTool | https://docs.gov.tools | https://github.com/IntersectMBO/govtool | Markdown | **High** | **To add** |
| SanchoNet | https://docs.sanchogov.tools | https://github.com/input-output-hk/sanchonet | Markdown | **High** | **To add** |
| Intersect Docs | https://docs.intersectmbo.org | https://github.com/IntersectMBO/intersect-documentation | Markdown | Medium | **To add** |

### Scaling / Layer 2

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| Hydra | https://hydra.family/head-protocol/ | https://github.com/cardano-scaling/hydra | Markdown/MDX | **High** | **To add** |
| Ouroboros Leios | https://leios.cardano-scaling.org/ | https://github.com/input-output-hk/ouroboros-leios | Markdown | Medium | **To add** |

### Standards & Portals

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority | Status |
|--------|----------|-------------------|--------|----------|--------|
| CIPs & CPS | https://cips.cardano.org | https://github.com/cardano-foundation/CIPs | Markdown | **High** | Indexed |
| Developer Portal | https://developers.cardano.org | https://github.com/cardano-foundation/developer-portal | Markdown | **High** | Indexed |
| Cardano Docs | https://docs.cardano.org | https://github.com/input-output-hk/cardano-documentation | Markdown | **High** | Indexed |

---

## Not Yet Indexed — Candidates for Future Additions

### Smart Contract Languages
| Tool | Why | Priority |
|------|-----|----------|
| Plutarch | Most optimized UPLC — used by serious DeFi (Plutonomicon) | Medium |
| Plu-ts | TypeScript on-chain + off-chain (Harmonic Labs) | Medium |
| Scalus | Scala 3 smart contracts | Low |
| Stellar Contracts | Higher-level Helios patterns | Low |

### Off-chain SDKs
| Tool | Why | Priority |
|------|-----|----------|
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
| Dingo | Blink Labs' Go node implementation | Low |
| Scrolls | TxPipe read-optimized chain data | Low |
| Carp | dcSpark modular Postgres indexer | Low |
| Ledger Sync | Cardano Foundation Java indexer | Low |
| gOuroboros | Go Ouroboros protocol (Blink Labs) | Low |
| Cardano GraphQL | GraphQL API | Low |

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
