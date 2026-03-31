# Cardano Developer Ecosystem

> A comprehensive map of tools, SDKs, and infrastructure for building on Cardano.
> Items marked with a checkmark are indexed in this MCP server.

## Smart Contract Languages (On-Chain)

All compile to Untyped Plutus Core (UPLC) for the Plutus VM.

| Tool | Description | Language | Indexed |
|------|-------------|----------|---------|
| Aiken | Most popular SC language (~75% adoption). Rust-like syntax. | Rust-like DSL | Yes |
| Plinth (Plutus Tx) | Original Haskell-based SC language by IOG/Intersect. | Haskell | Yes |
| OpShin | 100% valid Python that compiles to UPLC. | Python | Yes |
| Helios | DSL with JS/TS SDK, compiles in the browser. | JS/TS DSL | Yes |
| Marlowe | Domain-specific for financial contracts. Community-maintained. | Haskell DSL | Yes |
| Plutarch | Typed Haskell eDSL for highly optimized UPLC. | Haskell eDSL | No |
| Plu-ts | TypeScript eDSL for on-chain and off-chain. | TypeScript | No |
| Scalus | Scala 3 on-chain and off-chain platform. | Scala 3 | No |

## Off-Chain SDKs and Transaction Builders

| Tool | Description | Language | Indexed |
|------|-------------|----------|---------|
| Mesh SDK | Leading open-source TS SDK. Tx builder, wallet connectors, React. | TypeScript | Yes |
| Lucid Evolution | Production-ready TS tx builder by Anastasia Labs. | TypeScript | Yes |
| Evolution SDK | Next-gen Intersect SDK built on Effect. | TypeScript | Yes |
| Cardano JS SDK | IOG's comprehensive TS SDK. Powers Lace wallet. | TypeScript | Yes |
| PyCardano | Lightweight Python library for tx building. | Python | Yes |
| cardano-client-lib | Java client library by BloxBean. | Java | Yes |
| Cardano Serialization Lib | Low-level Rust/WASM serialization. | Rust/WASM | Yes |
| Blaze SDK | High-perf TS tx builder by Butane Protocol. | TypeScript | No |
| Atlas | Haskell PAB by GeniusYield. | Haskell | No |
| CML (Cardano Multiplatform Lib) | Rust/WASM by dcSpark. Conway era. | Rust/WASM | No |
| CTL (Cardano Transaction Lib) | PureScript framework by Plutonomicon. | PureScript | No |
| Cometa.js | Zero-dep, fast JS toolkit. | JavaScript | No |
| Cometa.py | High-perf Python library. | Python | No |

## Infrastructure and API Providers

| Tool | Description | Indexed |
|------|-------------|---------|
| Ogmios | WebSocket bridge for cardano-node. JSON/RPC interface. | Yes |
| Kupo | Fast, lightweight UTxO chain-index. | Yes |
| Blockfrost | Most popular hosted REST API (~25% adoption). | Yes |
| Mithril | Stake-based snapshots for fast node bootstrapping. | Yes |
| Oura | Rust pipeline for chain event streaming (TxPipe). | Yes |
| Pallas | Rust building blocks for Ouroboros/Cardano (TxPipe). | Yes |
| Cardano Wallet | HTTP REST API for wallet operations (CF). | Yes |
| Dolos | Lightweight data node by TxPipe. Fraction of node resources. | Yes |
| Yaci Store | Modular Java indexer with Blockfrost-compatible APIs. | Yes |
| DB-Sync | Official PostgreSQL chain indexer. Resource-heavy. | Yes |
| Koios | Decentralized community REST query layer. | No |
| Maestro | Managed blockchain indexer and APIs. | No |
| Carp | Modular Postgres indexer by dcSpark. | No |
| Scrolls | Read-optimized chain data collections by TxPipe. | No |
| Dingo | Go node implementation by Blink Labs. | No |
| Cardano GraphQL | Cross-platform typed GraphQL API. | No |

## Governance (Conway Era / CIP-1694)

| Tool | Description | Indexed |
|------|-------------|---------|
| GovTool | Official governance UI. Register as DRep, delegate, vote. | Yes |
| SanchoNet | Governance testnet for CIP-1694 features. | Yes |
| Intersect Docs | Governance and ecosystem documentation. | Yes |
| CIP-1694 | The governance proposal itself (in CIPs index). | Yes |

## Scaling and Layer 2

| Tool | Description | Indexed |
|------|-------------|---------|
| Hydra | State channels for instant finality off-chain. Production-ready. | Yes |
| Ouroboros Leios | Next-gen consensus with Input Endorsers. 30-50x throughput. | Yes |
| Midgard | Optimistic rollup by Anastasia Labs. | No |
| Gummiworm | Hydra-inspired rollup by Sundae Labs. | No |
| zkFold | ZK rollup / ZK smart contracts. | No |

## Testing and Local Development

| Tool | Description | Indexed |
|------|-------------|---------|
| Yaci DevKit | Complete local devnet. Instant creation, sub-second blocks. | Yes |
| Plutip | Disposable Cardano clusters for automated testing. | Yes |
| Aiken (built-in) | Unit tests and property-based testing for Aiken contracts. | Yes |
| Preview Testnet | Public testnet for early-stage testing. | No |
| Pre-Production Testnet | Public testnet resembling mainnet. | No |

## Wallet Connectors

| Tool | Description | Indexed |
|------|-------------|---------|
| CIP-30 | dApp-Wallet Web Bridge standard (in CIPs index). | Yes |
| CIP-95 | Conway era governance wallet extension. | Yes |
| Weld | Universal wallet connector by Cardano Forge. | No |
| Cardano Connect with Wallet | CF React wallet components. | No |

## Standards (CIPs)

All 170+ CIPs are indexed. Key ones for developers:

| CIP | Description |
|-----|-------------|
| CIP-25 | NFT Metadata Standard (immutable, in minting tx) |
| CIP-30 | dApp-Wallet Web Bridge |
| CIP-57 | Plutus Contract Blueprint (plutus.json) |
| CIP-68 | Datum Metadata Standard (updatable on-chain) |
| CIP-95 | Conway Era Wallet (governance) |
| CIP-113 | Programmable Token Standard |
| CIP-1694 | Voltaire On-Chain Governance |

## Developer Portals

| Resource | URL | Indexed |
|----------|-----|---------|
| Cardano Developer Portal | developers.cardano.org | Yes |
| Cardano Docs | docs.cardano.org | Yes |
| CIPs Repository | cips.cardano.org | Yes |
| Cardano Stack Exchange | cardano.stackexchange.com | No |
| Cardano Forum | forum.cardano.org | No |

## DeFi and Protocols (not indexed, out of scope)

DEXs: Minswap, SundaeSwap, WingRiders, Spectrum, MuesliSwap, Splash.
Aggregators: DexHunter.
Lending: Liqwid Finance, Lenfi, Optim Finance.
Stablecoins: USDA, USDM, DJED, iUSD.
Oracles: Charli3, Orcfax.

These are protocol-specific and out of scope for this MCP server, which focuses on developer tooling.

---

*Last updated: 2026-03-31. Sources: Cardano Foundation 2025 Developer Survey, developer.cardano.org, essential cardano.io.*
