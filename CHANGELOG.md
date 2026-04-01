# Changelog

All notable changes to the Cardano Unified MCP Server are documented here.

## [Unreleased]

### Added
- **Format-aware ingestion pipeline** — New format registry system with pluggable handlers for markdown, MDX, RST, OpenAPI YAML/JSON, Aiken source code, and TOML
- **Fail-loud validation phase** — Ingestion now validates all files BEFORE generating embeddings. Extension/format mismatches, unregistered formats, and content sniff failures are caught early with actionable error messages. No API costs incurred on bad data.
- **4-phase ingestion pipeline** — Restructured CLI: Fetch → Validate → Chunk → Embed+Store. New flags: `--validate-only` (dry run), `--skip-validation`
- **Format-specific chunking** — RST files split on underline headers, OpenAPI specs extract endpoints/schemas, Aiken source splits on function/type boundaries with doc comment preservation
- **`formatOverrides` on sources** — Mixed-format repos (e.g. Kupo with markdown + YAML) can now declare per-glob format overrides
- **MCP Resources** — `cardano://sources`, `cardano://source/{name}`, `cardano://doc/{source}/{path}` for browseable content
- **MCP Prompts** — `review-contract`, `explain-cip`, `suggest-tooling`, `build-transaction`, `governance-guide`
- **stdio transport** — Run with `--stdio` for local use with Claude Desktop, Claude Code, Cursor
- **New source categories** — `governance`, `scaling`, `testing` alongside existing `infrastructure`, `smart-contracts`, `sdk`, `standards`
- **9 new documentation sources** — GovTool, SanchoNet, Intersect Docs, Hydra, Ouroboros Leios, Dolos, Yaci Store, Plutip. Yaci DevKit recategorized from sdk to testing.
- `ECOSYSTEM.md` — Comprehensive Cardano developer tooling landscape
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`

### Fixed
- **Source filter bug** — `search_docs` source filter was applied after the limit, potentially returning 0 results. Now filters before limiting.
- **Format mismatches** — Kupo (markdown format but YAML files), Aiken Stdlib (markdown format but .ak files), Aiken Examples (markdown format but .ak + .toml) now correctly declared
- Expanded `extractTitle()` to handle `.yaml`, `.yml`, `.json`, `.ak`, `.toml` extensions

### Changed
- Version bumped to 0.2.0
- HTTP transport dynamically imported (only loaded when not in stdio mode)
- `RawDoc` now carries a `format` field through the pipeline
- `fetchSource()` split into `cloneSource()` (git only) and `readSourceFiles()` (read + format resolution)

## [0.1.0] — 2026-03-26

### Added
- Initial release
- Stateless HTTP MCP server via `StreamableHTTPServerTransport`
- Hybrid search: SQLite FTS5 full-text + vector cosine similarity
- Markdown/MDX document chunking with section-aware splitting
- OpenAI-compatible embeddings API integration with batch processing and rate limit handling
- 28 Cardano documentation sources across 4 categories
- Express server with optional API key authentication
- Kubernetes manifests: Deployment (2 replicas), Service, PVC, Ingress, CronJob for periodic re-ingestion
- Health check endpoint with index statistics
- Git-based ingestion CLI with source filtering and priority filtering

### Sources (initial)
Infrastructure: Ogmios, Kupo, Blockfrost, Cardano Node Wiki, DB-Sync, Mithril, Oura, Pallas, Cardano Wallet
Smart Contracts: Aiken (site + stdlib + examples), CIP-113, Plutus, OpShin, Helios, Marlowe
SDKs: Mesh SDK, Lucid Evolution, Evolution SDK, cardano-js-sdk, PyCardano, cardano-client-lib, Cardano Serialization Lib, Yaci DevKit
Standards: CIPs, Developer Portal, Cardano Docs
