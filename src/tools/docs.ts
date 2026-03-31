import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VectorDB } from "../db/vectordb.js";
import { generateEmbedding } from "../db/embeddings.js";
import { config } from "../config/env.js";

const CATEGORIES = [
  "infrastructure",
  "smart-contracts",
  "sdk",
  "standards",
  "governance",
  "scaling",
  "testing",
] as const;

export function registerDocTools(server: McpServer, db: VectorDB) {
  server.tool(
    "search_docs",
    "Search across all Cardano development documentation — infrastructure (Ogmios, Kupo, Blockfrost), smart contracts (Aiken, Plutus, OpShin), SDKs (Mesh, Evolution SDK, PyCardano), governance (GovTool, SanchoNet), scaling (Hydra, Leios), testing (Yaci DevKit), and standards (CIPs). Returns the most relevant documentation chunks for your query.",
    {
      query: z
        .string()
        .describe(
          "Natural language search query, e.g. 'how to build a transaction with Mesh SDK' or 'Aiken validator example'"
        ),
      category: z
        .enum(CATEGORIES)
        .optional()
        .describe("Filter by category to narrow results"),
      source: z
        .string()
        .optional()
        .describe(
          "Filter by specific source, e.g. 'Aiken', 'Mesh SDK', 'CIPs', 'Ogmios', 'Hydra'"
        ),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("Number of results to return (default 5)"),
      mode: z
        .enum(["hybrid", "semantic", "keyword"])
        .default("hybrid")
        .describe(
          "Search mode: 'hybrid' (default, combines both), 'semantic' (embedding similarity), 'keyword' (full-text search)"
        ),
    },
    async ({ query, category, source, limit, mode }) => {
      // Apply source filter at the DB level by fetching more and filtering early
      const fetchLimit = source ? limit * 4 : limit;

      let results;

      if (mode === "keyword" || !config.embeddingsApiKey) {
        const ftsQuery = buildFtsQuery(query);
        results = db.searchFTS(ftsQuery, fetchLimit, category);
      } else if (mode === "semantic") {
        const embedding = await generateEmbedding(query);
        results = db.searchVector(embedding, fetchLimit, category);
      } else {
        // Hybrid: run both and merge
        const ftsQuery = buildFtsQuery(query);
        const ftsResults = db.searchFTS(ftsQuery, fetchLimit * 2, category);

        let vectorResults: typeof ftsResults = [];
        if (config.embeddingsApiKey) {
          const embedding = await generateEmbedding(query);
          vectorResults = db.searchVector(embedding, fetchLimit * 2, category);
        }

        // Merge and deduplicate by ID
        const seen = new Map<string, (typeof ftsResults)[0]>();

        const maxFts = Math.max(...ftsResults.map((r) => r.score), 1);
        for (const r of ftsResults) {
          const normalized = r.score / maxFts;
          seen.set(r.id, { ...r, score: normalized * 0.4 });
        }
        for (const r of vectorResults) {
          const existing = seen.get(r.id);
          if (existing) {
            existing.score += r.score * 0.6;
          } else {
            seen.set(r.id, { ...r, score: r.score * 0.6 });
          }
        }

        results = [...seen.values()]
          .sort((a, b) => b.score - a.score);
      }

      // Apply source filter before limit so we don't lose relevant results
      if (source) {
        results = results.filter((r) =>
          r.source.toLowerCase().includes(source.toLowerCase())
        );
      }

      results = results.slice(0, limit);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No results found for "${query}". Try broader terms or a different category.`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r, i) =>
            `### ${i + 1}. [${r.source}] ${r.title}\n**Path:** ${r.path}\n**Score:** ${r.score.toFixed(3)}\n${r.url ? `**URL:** ${r.url}\n` : ""}\n${r.content}\n`
        )
        .join("\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${results.length} results for "${query}":\n\n${formatted}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_doc",
    "Retrieve a specific documentation page by its source and path. Use this after search_docs to get the full content of a document.",
    {
      source: z
        .string()
        .describe("The source name, e.g. 'Aiken', 'Mesh SDK', 'CIPs'"),
      path: z
        .string()
        .describe("The document path as returned by search_docs"),
    },
    async ({ source, path }) => {
      const doc = db.getDocByPath(source, path);
      if (!doc) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Document not found: ${source}/${path}. Use list_topics to see available documents.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `# [${doc.source}] ${doc.title}\n**Path:** ${doc.path}\n${doc.url ? `**URL:** ${doc.url}\n` : ""}\n\n${doc.content}`,
          },
        ],
      };
    }
  );

  server.tool(
    "list_topics",
    "Browse available documentation sources and topics. Shows what documentation is indexed and available for search.",
    {
      source: z
        .string()
        .optional()
        .describe(
          "Filter by source name to see its topics. Omit to see all sources with chunk counts."
        ),
    },
    async ({ source }) => {
      if (source) {
        const topics = db.listTopics(source);
        if (topics.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No topics found for source "${source}". Available sources:\n${db
                  .listSources()
                  .map((s) => `- ${s.source} (${s.category}, ${s.count} chunks)`)
                  .join("\n")}`,
              },
            ],
          };
        }

        const grouped = topics.reduce(
          (acc, t) => {
            const dir = t.path.split("/").slice(0, -1).join("/") || ".";
            if (!acc[dir]) acc[dir] = [];
            acc[dir].push(t);
            return acc;
          },
          {} as Record<string, typeof topics>
        );

        let output = `# ${source} — Documentation Topics\n\n`;
        for (const [dir, items] of Object.entries(grouped)) {
          output += `## ${dir}/\n`;
          for (const item of items) {
            output += `- **${item.title}** — \`${item.path}\`\n`;
          }
          output += "\n";
        }

        return { content: [{ type: "text" as const, text: output }] };
      }

      // List all sources
      const sources = db.listSources();
      const stats = db.getStats();

      let output = `# Cardano Documentation Index\n\n`;
      output += `**Total:** ${stats.total_chunks} chunks from ${stats.sources} sources\n\n`;

      const byCategory = sources.reduce(
        (acc, s) => {
          if (!acc[s.category]) acc[s.category] = [];
          acc[s.category].push(s);
          return acc;
        },
        {} as Record<string, typeof sources>
      );

      for (const [category, items] of Object.entries(byCategory)) {
        output += `## ${category}\n`;
        for (const item of items) {
          output += `- **${item.source}** — ${item.count} chunks\n`;
        }
        output += "\n";
      }

      output += `\nUse \`list_topics\` with a source name to browse its documents.`;

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}

function buildFtsQuery(query: string): string {
  return query
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => `"${w}"`)
    .join(" OR ");
}
