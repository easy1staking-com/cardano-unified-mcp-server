import { resolve } from "path";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",

  embeddingsApiKey: process.env.EMBEDDINGS_API_KEY || "",
  embeddingsApiBase:
    process.env.EMBEDDINGS_API_BASE || "https://api.openai.com/v1",
  embeddingsModel: process.env.EMBEDDINGS_MODEL || "text-embedding-3-small",
  embeddingsDimensions: 1536,

  mcpApiKey: process.env.MCP_API_KEY || "",

  dbPath: resolve(process.env.DB_PATH || "./data/docs.db"),
  reposDir: resolve(process.env.REPOS_DIR || "./repos"),
};
