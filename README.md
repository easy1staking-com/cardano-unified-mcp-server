# Cardano Unified MCP Server

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that gives AI assistants deep knowledge of the Cardano ecosystem — documentation, SDKs, smart contract languages, governance, scaling, and developer standards, all searchable from a single endpoint.

**Hosted instance:** `mcp.easy1staking.com`

## What's Inside

40+ documentation sources across 7 categories, continuously ingested from GitHub:

- **Infrastructure** — Ogmios, Kupo, Blockfrost, Mithril, Oura, Pallas, Dolos, Yaci Store, DB-Sync
- **Smart Contracts** — Aiken (lang + stdlib + examples), Plutus, OpShin, Helios, Marlowe, CIP-113
- **SDKs** — Mesh SDK, Lucid Evolution, Evolution SDK, cardano-js-sdk, PyCardano, cardano-client-lib
- **Governance** — GovTool, SanchoNet, Intersect Docs
- **Scaling** — Hydra, Ouroboros Leios
- **Testing** — Yaci DevKit, Plutip
- **Standards** — CIPs (170+), Developer Portal, Cardano Docs

See [ECOSYSTEM.md](ECOSYSTEM.md) for the full Cardano developer tooling landscape.

## Features

### MCP Tools
- **`search_docs`** — Hybrid semantic + keyword search across all indexed documentation
- **`get_doc`** — Retrieve full content of a specific document
- **`list_topics`** — Browse available sources and their topics

### MCP Resources
- `cardano://sources` — Overview of all indexed sources
- `cardano://source/{name}` — Topic listing for a specific source
- `cardano://doc/{source}/{path}` — Full document content

### MCP Prompts
- **`review-contract`** — Security review for Aiken/Plutus/OpShin contracts
- **`explain-cip`** — Developer-focused CIP explanations
- **`suggest-tooling`** — Recommend the right tools for your project
- **`build-transaction`** — Step-by-step transaction building guide
- **`governance-guide`** — CIP-1694 governance participation guide

## Quick Start

### Use the hosted instance

Add to your MCP client configuration (Claude Desktop, Claude Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "cardano": {
      "url": "https://mcp.easy1staking.com/mcp"
    }
  }
}
```

### Run locally (stdio)

```bash
git clone https://github.com/easy1staking-com/cardano-unified-mcp-server.git
cd cardano-unified-mcp-server
npm install
npm run build

# Ingest documentation (requires EMBEDDINGS_API_KEY for semantic search)
cp .env.example .env
# Edit .env with your OpenAI API key
npm run ingest

# Run in stdio mode
node dist/index.js --stdio
```

Add to your MCP client:

```json
{
  "mcpServers": {
    "cardano": {
      "command": "node",
      "args": ["/path/to/cardano-unified-mcp-server/dist/index.js", "--stdio"]
    }
  }
}
```

### Run as HTTP server

```bash
# Start the server (default port 3000)
npm start

# Or with API key protection
MCP_API_KEY=your-secret npm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `EMBEDDINGS_API_KEY` | — | OpenAI API key for semantic search |
| `EMBEDDINGS_API_BASE` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `EMBEDDINGS_MODEL` | `text-embedding-3-large` | Embedding model |
| `MCP_API_KEY` | — | Optional Bearer token for HTTP mode |
| `DB_PATH` | `./data/docs.db` | SQLite database path |
| `REPOS_DIR` | `./repos` | Cloned repositories directory |

## Architecture

```
┌─────────────────────────────────────────────┐
│              MCP Clients                     │
│  (Claude Desktop, Claude Code, Cursor, etc.) │
└──────────────┬──────────────────────────────┘
               │ stdio or HTTP
┌──────────────▼──────────────────────────────┐
│         Cardano Unified MCP Server           │
│                                              │
│  ┌─────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Tools  │  │ Resources │  │  Prompts  │  │
│  └────┬────┘  └─────┬─────┘  └─────┬─────┘  │
│       └─────────────┼───────────────┘        │
│              ┌──────▼──────┐                 │
│              │  VectorDB   │                 │
│              │  (SQLite +  │                 │
│              │  FTS5 +     │                 │
│              │  Embeddings)│                 │
│              └─────────────┘                 │
└──────────────────────────────────────────────┘

Ingestion Pipeline (weekly CronJob):
  GitHub repos → clone/pull → chunk → embed → upsert
```

### Search Modes

- **Hybrid** (default) — Combines FTS (40% weight) + vector similarity (60% weight)
- **Semantic** — Embedding cosine similarity only
- **Keyword** — Full-text search with Porter stemming (no API key needed)

## Kubernetes Deployment

The server is designed for stateless horizontal scaling on Kubernetes:

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/cronjob-ingest.yaml

# Create secrets
kubectl create secret generic cardano-mcp-secrets \
  --from-literal=EMBEDDINGS_API_KEY=sk-... \
  --from-literal=MCP_API_KEY=your-secret
```

- 2 replicas with health checks
- Persistent volume for the SQLite database
- Weekly CronJob for documentation re-ingestion

## Ingestion

```bash
# Ingest all sources
npm run ingest

# Ingest a specific source
npm run ingest -- Aiken

# Ingest by priority
npm run ingest -- --priority=high

# Skip embeddings (keyword-only mode)
npm run ingest -- --skip-embeddings
```

## Development

```bash
npm run dev          # Watch mode with hot reload
npm run typecheck    # Type checking only
npm run build        # Compile TypeScript
```

## License

[Apache-2.0](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.
