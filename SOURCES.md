# Cardano Unified MCP Server — Sources & Scope

> The authoritative list of indexed sources lives in
> [`config/sources.yaml`](./config/sources.yaml). For the project's
> scope, trust model, and acceptance criteria read
> [`ABOUT.md`](./ABOUT.md). For the YAML schema reference read
> [`docs/sources-schema.md`](./docs/sources-schema.md). This document
> covers ecosystem context and crawl notes that don't belong in the
> YAML.

## Scope

**IN:** Everything needed to BUILD on Cardano — docs, SDKs, smart
contract languages, off-chain tooling, standards, governance, scaling/L2,
testing.

**OUT:** Protocol-specific DeFi (Indigo), anything requiring local
software (Cardano Node MCP, Yaci DevKit runtime), node runtime
operations.

## Existing Cardano MCP servers (for reference)

| Project | URL | Status | Notes |
|---------|-----|--------|-------|
| Yaci DevKit MCP | https://github.com/bloxbean/yaci-devkit (PR #146 merged) | **Future proxy** | 5 tools, devnet lifecycle — proxy when user runs local devnet |
| Flux Agent Skills | https://github.com/Flux-Point-Studios/cardano-agent-skills | **Reference only** | Not an MCP server, 25 skill definition files |
| Indigo MCP | https://github.com/IndigoProtocol/indigo-mcp | **Out of scope** | Protocol-specific DeFi |
| Koios MCP | https://github.com/michaeljfazio/koios-mcp | **Out of scope** | Ecosystem uses Kupo/Ogmios/Blockfrost instead |
| Cardano Node MCP | https://github.com/michaeljfazio/cardano-node-mcp | **Out of scope** | Requires local node |
| Mesh Skills | https://x.com/jinglescode/status/2033524038535163966 | **Reference only** | AI skills for MeshSDK |

## CIP crawl notes

The CIPs repo has a nested structure. Each CIP lives in its own
directory:

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
- CIP-0095 (Conway Era Wallet — Governance)
- CIP-0113 (Programmable Tokens)
- CIP-0116 (Universal JSON Encoding for Data Types)
- CIP-1694 (Voltaire Governance)
- CIP-1852 (HD Wallets for Cardano)

## Rebuild checklist

When rebuilding the docs index from scratch:

1. Ensure `config/sources.yaml` is up to date and passes validation
   (`npm run ingest -- --validate-only`).
2. Delete the existing SQLite DB (or accept in-place overwrite — each
   source is cleared and re-upserted).
3. Run `npm run ingest` with an `EMBEDDINGS_API_KEY` set for full
   embeddings, or `--skip-embeddings` for a keyword-only rebuild.
4. Verify the count via `cardano://sources` resource (`db.getStats()`).
5. Run the eval suite: `npm run eval` to catch regressions.
