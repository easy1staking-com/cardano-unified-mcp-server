# CLAUDE.md — Project Instructions

## Build & Run

```bash
npm run build          # TypeScript → dist/
npm run ingest         # Clone repos + chunk + embed → SQLite
npm run start          # MCP server (stdio mode)
npm run start:http     # MCP server (HTTP mode)
```

## Adding New Documentation Sources

The single source of truth is `config/sources.yaml`. When adding a new source:

1. **Match the `format` field to the actual file types being ingested**, not the repo's documentation format:
   - `.ak` files → `format: aiken` (splits on `fn`, `type`, `validator`, `const`)
   - `.py` files → `format: python` (splits on `class`, `def`, `async def`)
   - `.md` files → `format: markdown` (splits on `#` headings)
   - `.mdx` files → `format: mdx` (markdown + JSX stripping)
   - `.rst` files → `format: rst`
   - `.yaml`/`.yml` files → `format: openapi`
   - `.toml` files → `format: toml`

2. **For repos with mixed file types**, set `format` to the primary language and use `formatOverrides` for the rest. Example: an Aiken repo with a README:
   ```yaml
   format: aiken
   formatOverrides:
     "**/*.md": markdown
   ```

3. **Getting the format wrong means bad chunking** — e.g., using `markdown` for Python files produces one giant section (no `#` headers to split on), which then gets chopped at arbitrary character boundaries instead of semantic `class`/`def` boundaries. Always verify.

4. The `category` enum is defined in `src/config/sources.ts` (`DocCategorySchema`). If a new category is needed, add it to both the `DocCategory` type and the Zod schema.

5. Format handlers live in `src/ingest/formats/`. When adding a handler, also register it in `src/ingest/chunker.ts` (import) and update `EXTENSION_TO_FORMAT` + `FORMAT_EXTENSIONS` in `src/ingest/formats/index.ts`.
