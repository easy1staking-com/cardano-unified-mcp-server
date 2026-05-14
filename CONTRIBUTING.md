# Contributing to Cardano Unified MCP Server

Thank you for your interest in contributing! This project is the search + embedding + MCP transport layer on top of [`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills). Read [ABOUT.md](ABOUT.md) before opening a PR — it covers scope, trust model, and the split of responsibilities between this repo and the skills repo.

## How to Contribute

### Adding a New Documentation Source

**Open the PR against [`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills), not this repo.** The skills registry is the single source of truth for what gets indexed. This server picks new sources up automatically on the next Sunday indexer run.

See cardano-dev-skills' [CONTRIBUTING](https://github.com/easy1staking-com/cardano-dev-skills/blob/main/docs/CONTRIBUTING.md) and [source-vetting policy](https://github.com/easy1staking-com/cardano-dev-skills/blob/main/registry/sources.yaml) for the bar a new source must clear.

### Adding a New Workflow Skill

Same as above — workflow skills live in [`cardano-dev-skills/skills/`](https://github.com/easy1staking-com/cardano-dev-skills/tree/main/skills) and are auto-loaded as MCP prompts by this server.

### Bug Fixes and Improvements to the MCP Server

This is the place for: search ranking improvements, new format handlers, chunker tuning, MCP transport changes, deployment fixes, new MCP tools, additions to the existing tool/resource/prompt surface.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make your changes
4. Run `npm run typecheck` and `npm run validate:skills` — both must pass
5. Submit a pull request with a clear description of the change

### Development Setup

```bash
# Clone both repos as siblings — this server depends on cardano-dev-skills.
git clone https://github.com/easy1staking-com/cardano-dev-skills.git
git clone https://github.com/easy1staking-com/cardano-unified-mcp-server.git
cd cardano-unified-mcp-server
npm install
cp .env.example .env
# Edit .env with your EMBEDDINGS_API_KEY (optional — keyword search works without it)
npm run dev
```

### Project Structure

```
src/
  index.ts            — Entry point (stdio + HTTP transports)
  config/
    env.ts            — Environment configuration (incl. SKILLS_PATH)
    sources.ts        — Loader for skills' registry/sources.yaml
  db/
    vectordb.ts       — SQLite vector database (FTS5 + sqlite-vec)
    embeddings.ts     — OpenAI-compatible embeddings API
  ingest/
    cli.ts            — Ingestion CLI
    fetcher.ts        — Reads vendored content from skills checkout
    chunker.ts        — Document chunking
    formats/          — Per-format chunkers (markdown, mdx, aiken, …)
    validator.ts      — Per-source content validation
  tools/
    docs.ts           — search_docs, get_doc, list_topics
    resources.ts      — cardano:// MCP resources
    prompts.ts        — Auto-loads skills as MCP prompts
    skills.ts         — list_skills, get_skill MCP tools
scripts/
  validate-skills.ts  — Contract test: verifies skills registry shape
docs/
  architecture.md     — Component, query, and ingestion diagrams
```

### Guidelines

- Keep the server dependency-free at runtime (no Blockfrost, Ogmios, etc. — this is a documentation server)
- New format handlers go in `src/ingest/formats/`. Register them in `chunker.ts` and `formats/index.ts` (`EXTENSION_TO_FORMAT` + `FORMAT_EXTENSIONS`).
- Test your changes compile: `npm run typecheck`
- Verify the skills registry still resolves: `npm run validate:skills`
- Follow the existing code style

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- For new source suggestions, open the issue against `cardano-dev-skills` instead

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](LICENSE).
