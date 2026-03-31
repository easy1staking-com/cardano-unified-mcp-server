# Contributing to Cardano Unified MCP Server

Thank you for your interest in contributing! This project aims to be the most comprehensive MCP server for Cardano developers.

## How to Contribute

### Adding a New Documentation Source

This is the most impactful contribution you can make. See [SOURCES.md](SOURCES.md) for the current index and candidates.

1. Add the source to `src/config/sources.ts` with the correct category, repo URL, docs path, format, and glob patterns
2. Run `npm run ingest -- YourSourceName` to test ingestion
3. Verify chunks look correct with `npm run dev` and querying via the `list_topics` tool
4. Update `SOURCES.md` to reflect the new source
5. Submit a pull request

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
src/
  index.ts           — Entry point (stdio + HTTP transports)
  config/
    env.ts           — Environment configuration
    sources.ts       — Documentation source registry
  db/
    vectordb.ts      — SQLite vector database (FTS5 + embeddings)
    embeddings.ts    — OpenAI-compatible embeddings API
  ingest/
    cli.ts           — Ingestion CLI
    fetcher.ts       — Git clone/pull + file extraction
    chunker.ts       — Document chunking
  tools/
    docs.ts          — MCP tools (search_docs, get_doc, list_topics)
    resources.ts     — MCP resources (cardano:// URIs)
    prompts.ts       — MCP prompt templates
```

### Guidelines

- Keep the server dependency-free at runtime (no Blockfrost, Ogmios, etc. — this is a documentation server)
- New sources should have a public GitHub repo with markdown/MDX documentation
- Use the existing category system: `infrastructure`, `smart-contracts`, `sdk`, `standards`, `governance`, `scaling`, `testing`
- Test your changes compile: `npm run typecheck`
- Follow the existing code style

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- For new source suggestions, include the repo URL and docs path

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](LICENSE).
