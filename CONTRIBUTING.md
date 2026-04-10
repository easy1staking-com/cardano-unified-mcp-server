# Contributing to Cardano Unified MCP Server

Thank you for your interest in contributing! This project aims to be a neutral, comprehensive MCP server for people building on Cardano. Before opening a PR, please read [ABOUT.md](ABOUT.md) — it covers the project's scope, trust model, and acceptance criteria.

## How to Contribute

### Adding a New Documentation Source

This is the most impactful contribution you can make.

**First, check the acceptance criteria in [ABOUT.md](ABOUT.md#acceptance-criteria-for-a-documentation-source).** A source is accepted only if it is an actively-maintained framework, SDK, library, tool, reference, or standard that helps people *build* on Cardano. Tokens, dApps, DEXes, wallet products, and protocol-specific projects are out of scope by design.

If the source qualifies:

1. Add an entry to [`config/sources.yaml`](config/sources.yaml). See [`docs/sources-schema.md`](docs/sources-schema.md) for every field, the allowed categories, format enum, and glob semantics.
2. Validate the YAML locally — this is the same check CI runs on your PR:
   ```bash
   npm run validate:sources
   ```
3. (Optional) Dry-run the ingest pipeline against the new source without burning embedding credits:
   ```bash
   npm run ingest -- "YourSourceName" --validate-only
   ```
4. Full ingest for just that source once validation passes:
   ```bash
   npm run ingest -- "YourSourceName"
   ```
5. Verify chunks look right with `npm run dev` and the `list_topics` tool.
6. Submit a pull request. The [Validate Sources](.github/workflows/validate-sources.yml) workflow will run automatically — a red badge on the PR means a schema error in your YAML; the job log shows the exact field path.

There is **no** need to edit `src/config/sources.ts` — it is now a loader that reads the YAML. `config/sources.yaml` is the single source of truth.

### Bug Fixes and Improvements

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make your changes
4. Run `npm run typecheck` to ensure no type errors
5. Submit a pull request with a clear description of the change

### Development Setup

```bash
git clone https://github.com/easy1staking-com/cardano-unified-mcp-server.git
cd cardano-unified-mcp-server
npm install
cp .env.example .env
# Edit .env with your EMBEDDINGS_API_KEY (optional, keyword search works without it)
npm run dev
```

### Project Structure

```
config/
  sources.yaml       — Authoritative list of indexed doc sources (edit this to add a source)
scripts/
  validate-sources.ts — Standalone YAML validator used by CI
src/
  index.ts           — Entry point (stdio + HTTP transports)
  config/
    env.ts           — Environment configuration
    sources.ts       — Zod-validated loader for config/sources.yaml
  db/
    vectordb.ts      — SQLite vector database (FTS5 + sqlite-vec)
    embeddings.ts    — OpenAI-compatible embeddings API
  ingest/
    cli.ts           — Ingestion CLI
    fetcher.ts       — Git clone/pull + file extraction
    chunker.ts       — Document chunking
    validator.ts     — Per-source content validation
  tools/
    docs.ts          — MCP tools (search_docs, get_doc, list_topics)
    resources.ts     — MCP resources (cardano:// URIs)
    prompts.ts       — MCP prompt templates
docs/
  architecture.md    — Component, query, and ingestion diagrams
  sources-schema.md  — config/sources.yaml schema reference
```

### Guidelines

- Keep the server dependency-free at runtime (no Blockfrost, Ogmios, etc. — this is a documentation server)
- New sources must satisfy [the acceptance criteria in ABOUT.md](ABOUT.md#acceptance-criteria-for-a-documentation-source)
- Use the existing category system: `infrastructure`, `smart-contracts`, `sdk`, `standards`, `governance`, `scaling`, `testing`
- Test your changes compile: `npm run typecheck`
- Validate `config/sources.yaml` before pushing: `npm run validate:sources`
- Follow the existing code style

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- For new source suggestions, include the repo URL and docs path

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](LICENSE).
