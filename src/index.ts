import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { VectorDB } from "./db/vectordb.js";
import { registerDocTools } from "./tools/docs.js";
import { config } from "./config/env.js";

const db = new VectorDB();

// Create MCP server
const mcpServer = new McpServer({
  name: "Cardano Unified MCP",
  version: "0.1.0",
});

// Register tools
registerDocTools(mcpServer, db);

// Express app
const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  const stats = db.getStats();
  res.json({
    status: "ok",
    version: "0.1.0",
    stats,
  });
});

// Optional API key auth middleware
function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!config.mcpApiKey) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${config.mcpApiKey}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// MCP endpoint — Streamable HTTP
app.post("/mcp", authMiddleware, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless for K8s scaling
  });

  await mcpServer.connect(transport);

  await transport.handleRequest(req, res, req.body);
});

// Handle GET for SSE stream (server-initiated messages)
app.get("/mcp", authMiddleware, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await mcpServer.connect(transport);

  await transport.handleRequest(req, res);
});

// Handle DELETE for session termination
app.delete("/mcp", (_req, res) => {
  res.status(200).end();
});

// Start server
app.listen(config.port, config.host, () => {
  const stats = db.getStats();
  console.log(`
╔══════════════════════════════════════════════╗
║       Cardano Unified MCP Server v0.1.0      ║
╠══════════════════════════════════════════════╣
║  Endpoint:  http://${config.host}:${config.port}/mcp${" ".repeat(Math.max(0, 14 - String(config.port).length))}║
║  Health:    http://${config.host}:${config.port}/health${" ".repeat(Math.max(0, 11 - String(config.port).length))}║
║  Docs:      ${stats.total_chunks} chunks from ${stats.sources} sources${" ".repeat(Math.max(0, 12 - String(stats.total_chunks).length - String(stats.sources).length))}║
║  Auth:      ${config.mcpApiKey ? "API key required" : "Open (no API key)"}${" ".repeat(config.mcpApiKey ? 7 : 6)}║
╚══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  db.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  db.close();
  process.exit(0);
});
