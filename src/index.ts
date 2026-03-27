import express from "express";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { VectorDB } from "./db/vectordb.js";
import { registerDocTools } from "./tools/docs.js";
import { config } from "./config/env.js";

const db = new VectorDB();

function createMcpServer() {
  const server = new McpServer({
    name: "Cardano Unified MCP",
    version: "0.1.0",
  });
  registerDocTools(server, db);
  return server;
}

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

// MCP endpoint — Streamable HTTP (stateless)
app.post("/mcp", authMiddleware, async (req: Request, res: Response) => {
  const server = createMcpServer();
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless for K8s scaling
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless: GET and DELETE not supported
app.get("/mcp", (_req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    })
  );
});

app.delete("/mcp", (_req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    })
  );
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
