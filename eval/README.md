# Evaluation Harness

Quality regression testing for the Cardano Unified MCP Server's search results.

## How It Works

The eval harness runs a fixed set of queries against the local database and checks whether the expected source appears in the top-3 results. It mirrors the exact search logic used by the MCP `search_docs` tool (hybrid/semantic/keyword modes with the same scoring).

## Quick Start

```bash
# Run evaluation and print results
npm run eval

# Run keyword-only (no embeddings API calls)
npm run eval:keyword

# Save a snapshot (for later comparison)
npm run eval:snapshot

# Tag a snapshot (e.g., before a release)
npm run eval -- --snapshot --tag "v0.2.0-pre"

# Compare against a baseline snapshot
npm run eval -- --compare 2026-03-31-12-00-00-v0.2.0-pre.json

# Compare and save new snapshot in one go
npm run eval -- --snapshot --tag "v0.2.0-post" --compare 2026-03-31-12-00-00-v0.2.0-pre.json
```

## Workflow: Before and After Deployment

```
# 1. Before changing anything — snapshot current quality
npm run eval -- --snapshot --tag "before-format-rewrite"

# 2. Make changes (re-ingest, update chunker, etc.)
npm run ingest

# 3. Compare against baseline
npm run eval -- --snapshot --tag "after-format-rewrite" \
  --compare <baseline-filename>.json
```

The comparison prints a table:

```
  Query                    Old Top Source         New Top Source         Δ Score  Status
  ──────────────────────────────────────────────────────────────────────────────────────
  mesh-tx                  Mesh SDK               Mesh SDK               +0.012   OK
  kupo-api                 Kupo                   Kupo                   +0.145  IMPR
  pycardano-tx             (none)                 PyCardano              +0.380  PASS
  aiken-stdlib-list        Aiken                  Aiken Examples         -0.090  REGR
```

Status meanings:
- **OK** — Same result, score within tolerance
- **IMPR** — Score improved by >0.05
- **REGR** — Score dropped by >0.05 (investigate)
- **NEW_PASS** — Previously failed, now passes (expected source in top-3)
- **NEW_FAIL** — Previously passed, now fails (exits with code 1)

## The Query Set

Queries are defined in `eval/queries.json`. Each query specifies:

- `id` — Unique identifier
- `query` — The search query text
- `expectedSources` — Which source(s) SHOULD appear in the top-3
- `category` — Category filter (null = no filter)
- `mode` — Search mode: hybrid, semantic, or keyword
- `description` — What this query tests

### Adding New Queries

Edit `eval/queries.json` and add an entry. Then take a new baseline snapshot. The query set should cover:
- Every source category (infrastructure, smart-contracts, sdk, standards, governance, scaling, testing)
- Every search mode (hybrid, semantic, keyword)
- Every file format (markdown, mdx, rst, openapi, aiken)
- Both specific and broad queries

## Snapshots

Snapshots are saved as JSON in `eval/snapshots/`. Each contains:
- Full results for every query (top-5 with scores and content previews)
- Database stats at the time (chunk count, source count)
- Pass/fail per query
- Summary statistics

**Commit snapshots to git** to track quality over time. Naming convention:
```
eval/snapshots/
  2026-03-31-12-00-00-v0.2.0-pre.json
  2026-03-31-14-30-00-v0.2.0-post.json
  2026-04-05-10-00-00-v0.2.1.json
```

## CI Integration

The `--compare` flag exits with code 1 if any query that previously passed now fails (NEW_FAIL). Use this in CI:

```bash
npm run eval -- --compare baseline.json
# Exit code 0 = no regressions
# Exit code 1 = quality regression detected
```
