# Cardano Unified MCP Server - Source Index

> This index is used to periodically rebuild the documentation and tool ingestion pipeline.
> Last updated: 2026-03-26

## Scope

**IN:** Everything needed to BUILD on Cardano — docs, SDKs, smart contract languages, off-chain tooling, standards.
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

## Documentation Sources - Core Infrastructure

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority |
|--------|----------|-------------------|--------|----------|
| Ogmios | https://ogmios.dev | https://github.com/cardanosolutions/ogmios | Hugo/Markdown | **High** |
| Kupo | https://cardanosolutions.github.io/kupo | https://github.com/CardanoSolutions/kupo | OpenAPI + Markdown | **High** |
| Blockfrost | https://blockfrost.dev / https://docs.blockfrost.io | https://github.com/blockfrost/openapi | OpenAPI YAML + Docusaurus | **High** |
| Cardano Node | https://cardano-node.cardano.intersectmbo.org/ | https://github.com/input-output-hk/cardano-node-wiki | Markdown | Medium |
| Cardano CLI | https://docs.cardano.org/development-guidelines/use-cli/ | https://github.com/input-output-hk/cardano-node-wiki | Markdown | Medium |
| DB-Sync | - | https://github.com/IntersectMBO/cardano-db-sync (doc/) | Markdown | Low |

## Documentation Sources - Smart Contract Languages

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority |
|--------|----------|-------------------|--------|----------|
| Aiken | https://aiken-lang.org | https://github.com/aiken-lang/aiken | Nextra/MDX | **High** |
| Plutus / Plinth | https://plutus.cardano.intersectmbo.org/docs/ | https://github.com/IntersectMBO/plutus | Docusaurus/Markdown | Medium |
| OpShin | https://opshin.opshin.dev | https://github.com/opshin/opshin | mdBook/Markdown | Medium |
| Helios | https://helios-lang.io | https://github.com/Hyperion-BT/helios-book | mdBook/Markdown | Low |
| Marlowe | https://docs.marlowe.iohk.io | https://github.com/marlowe-lang | Docusaurus/Markdown | Low |

## Documentation Sources - Off-chain SDKs & Frameworks

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority |
|--------|----------|-------------------|--------|----------|
| Mesh SDK | https://meshjs.dev | https://github.com/MeshJS/mesh | Next.js/TSX/MDX | **High** |
| Evolution SDK (No Witness Labs) | https://no-witness-labs.github.io/evolution-sdk/ | https://github.com/IntersectMBO/evolution-sdk (docs/content/docs/) | Fumadocs/MDX | **High** |
| cardano-js-sdk | https://input-output-hk.github.io/cardano-js-sdk/ | https://github.com/input-output-hk/cardano-js-sdk | TypeDoc + Markdown | Medium |
| PyCardano | https://pycardano.readthedocs.io | https://github.com/Python-Cardano/pycardano (docs/source/) | Sphinx/RST | Medium |
| Yaci DevKit | https://devkit.yaci.xyz | https://github.com/bloxbean/yaci-devkit | Markdown | Medium |

### Note on Evolution SDK

Evolution SDK (`@evolution-sdk/lucid`) is the next-generation Cardano off-chain framework by No Witness Labs, incubated under Intersect. Built on the Effect library for typed functional composition. Replaces Lucid Evolution.

## Documentation Sources - Standards & Portals

| Source | Docs URL | Raw Docs (GitHub) | Format | Priority |
|--------|----------|-------------------|--------|----------|
| CIPs & CPS | https://cips.cardano.org | https://github.com/cardano-foundation/CIPs | Markdown (nested: CIP-XXXX/README.md + referenced files) | **High** |
| Developer Portal | https://developers.cardano.org | https://github.com/cardano-foundation/developer-portal | Docusaurus/Markdown | **High** |
| Cardano Docs | https://docs.cardano.org | https://github.com/input-output-hk/cardano-documentation | Docusaurus/Markdown | **High** |

### CIP Crawl Notes

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
- CIP-0116 (Universal JSON Encoding for Data Types)
- CIP-1694 (Voltaire Governance)
- CIP-1852 (HD Wallets for Cardano)

Crawl ALL CIPs (170+), but tag these as high-relevance for developer queries.

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

## Adding New Sources

When a new Cardano dev tool or documentation source is discovered:
1. Add it to the appropriate table above
2. Set priority (High/Medium/Low)
3. Note the format and raw docs location
4. Run a rebuild to include it
