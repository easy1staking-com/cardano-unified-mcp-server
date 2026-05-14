# CLAUDE.md — Project Instructions

## Build & Run

```bash
npm run build          # TypeScript → dist/
npm run ingest         # Read vendored skills content → chunk + embed → SQLite
npm run start          # MCP server (stdio mode)
npm run start:http     # MCP server (HTTP mode)
```

## Architecture in one line

This server is the **search + embedding + MCP transport layer** over content curated by [`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills). Skills is the source of truth for *what* to index; this repo is the source of truth for *how* to chunk + index + serve it.

## The skills dependency

- Path: `SKILLS_PATH` env var, default `../cardano-dev-skills` (sibling clone).
- Registry: `${SKILLS_PATH}/registry/sources.yaml` — list of indexed sources with `glob_patterns`, `format`, `format_overrides`.
- Vendored content: `${SKILLS_PATH}/docs/sources/<slug>/` — pre-fetched markdown/MDX/Aiken/Python/RST/etc. files, ready to chunk.
- Workflow skills: `${SKILLS_PATH}/skills/*/SKILL.md` — each one is exposed as both an MCP prompt and via the `get_skill` tool.

The loader (`src/config/sources.ts`) reads the registry. The fetcher (`src/ingest/fetcher.ts`) reads vendored content directly — no git clones at ingest time.

## Adding a new documentation source

**Open a PR against `cardano-dev-skills`**, not this repo. The skills repo enforces the acceptance criteria (active maintenance, build-on-Cardano scope, permissive license) and runs the fetch step that vendors the content. This server will pick the new source up automatically on the next Sunday indexer run.

When adding a source to skills' registry, match the `format` field to the actual file extensions being indexed (the chunker dispatches on these):

- `.ak` files → `format: aiken` (splits on `fn`, `type`, `validator`, `const`)
- `.py` files → `format: python` (splits on `class`, `def`, `async def`)
- `.md` files → `format: markdown` (splits on `#` headings)
- `.mdx` files → `format: mdx` (markdown + JSX stripping)
- `.rst` files → `format: rst`
- `.yaml`/`.yml`/`.json` files → `format: openapi`
- `.toml` files → `format: toml`

For mixed-file repos, set `format` to the primary language and use `format_overrides` for the rest:

```yaml
format: aiken
format_overrides:
  "**/*.md": markdown
```

## Contract check

Before pushing changes that touch the loader, fetcher, or env config:

```bash
npm run validate:skills   # Asserts every source resolves to a vendored dir
npm run typecheck
```

The same check runs nightly in CI against skills' HEAD via `.github/workflows/skills-drift.yml` to catch upstream drift before Sunday's indexer.

## Format handler internals

Format handlers live in `src/ingest/formats/`. When adding a handler, also register it in `src/ingest/chunker.ts` (import) and update `EXTENSION_TO_FORMAT` + `FORMAT_EXTENSIONS` in `src/ingest/formats/index.ts`. The `category` enum lives in `src/config/sources.ts` (`DocCategorySchema`) and must match the enum used by skills' registry.
