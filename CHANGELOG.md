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
- **sqlite-vec** for ANN vector search — Replaces brute-force in-memory cosine similarity. Embeddings are searched in C inside SQLite via `vec0` virtual table with cosine distance metric. Eliminates ~120MB memory spike per query.
- **Read-only DB mode** — Server pods open SQLite with `DB_READ_ONLY=true`, preventing writes and allowing safe concurrent reads. Only the ingest CronJob writes.
- **Embeddings upgrade** — Switched to `text-embedding-3-large` (3072 dims), batch size 100, 500ms inter-batch delay
- **Keep-alive headers** on HTTP responses for persistent MCP client connections
- **Evaluation harness** (`eval/`) — 25 golden queries with snapshot/compare workflow. `npm run eval:snapshot` to baseline, `npm run eval -- --compare <file>` to detect regressions. Exits with code 1 on quality regression for CI use.
- `ECOSYSTEM.md` — Comprehensive Cardano developer tooling landscape
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `CHANGELOG.md`

### Sources
- **Added**: Aiken Design Patterns (Anastasia Labs), Pebble (Harmonic Labs TS smart contract DSL), Buildooor (Harmonic Labs tx builder), Koios (community chain indexer API + OpenAPI spec), Cardano GraphQL, Evolution SDK Packages, GovTool, SanchoNet, Hydra, Ouroboros Leios, Dolos, Yaci Store
- **Removed**: Helios (abandoned since Jan 2024), Marlowe (dead), Plutip (stale since Nov 2024, superseded by Yaci DevKit), Lucid Evolution (Anastasia Labs — abandoned, superseded by Evolution SDK), Intersect Docs (repo does not exist)
- **Fixed**: Mesh SDK path (apps/docs/ 404 → packages/), OpShin path (docs/ is pdoc HTML → root README only), Kupo path (narrowed to README + API spec), Aiken source (was pointing at compiler repo → now aiken-lang/site)
- Yaci DevKit recategorized from sdk to testing

### Fixed
- **Stateless MCP server** — Fixed "Already connected to a transport" crash by creating a fresh McpServer per request, following official SDK `simpleStatelessStreamableHttp` pattern. GET/DELETE now return 405.
- **Source filter bug** — `search_docs` source filter was applied after the limit, potentially returning 0 results. Now filters before limiting.
- **Format mismatches** — Kupo (markdown format but YAML files), Aiken Stdlib (markdown format but .ak files), Aiken Examples (markdown format but .ak + .toml) now correctly declared
- Expanded `extractTitle()` to handle `.yaml`, `.yml`, `.json`, `.ak`, `.toml` extensions

### Changed
- Version bumped to 0.2.0
- HTTP transport dynamically imported (only loaded when not in stdio mode)
- `RawDoc` now carries a `format` field through the pipeline
- `fetchSource()` split into `cloneSource()` (git only) and `readSourceFiles()` (read + format resolution)
- K8s deployment: `DB_READ_ONLY=true` env var for server pods, single replica recommended (sticky sessions needed for multi-pod)

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
