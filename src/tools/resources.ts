import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VectorDB } from "../db/vectordb.js";

export function registerResources(server: McpServer, db: VectorDB) {
  // Resource: list all indexed documentation sources
  server.resource(
    "sources",
    "cardano://sources",
    {
      description:
        "Overview of all indexed Cardano documentation sources with categories and chunk counts",
      mimeType: "text/markdown",
    },
    async () => {
      const sources = db.listSources();
      const stats = db.getStats();

      const byCategory = sources.reduce(
        (acc, s) => {
          if (!acc[s.category]) acc[s.category] = [];
          acc[s.category].push(s);
          return acc;
        },
        {} as Record<string, typeof sources>
      );

      let md = `# Cardano Documentation Sources\n\n`;
      md += `**Total:** ${stats.total_chunks} chunks from ${stats.sources} sources across ${stats.categories} categories\n\n`;

      for (const [category, items] of Object.entries(byCategory)) {
        md += `## ${category}\n`;
        for (const item of items) {
          md += `- **${item.source}** — ${item.count} chunks\n`;
        }
        md += "\n";
      }

      return { contents: [{ uri: "cardano://sources", text: md, mimeType: "text/markdown" }] };
    }
  );

  // Resource template: specific source details
  server.resource(
    "source-detail",
    "cardano://source/{name}",
    {
      description:
        "Detailed topic listing for a specific documentation source (e.g. cardano://source/Aiken)",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const name = uri.pathname.split("/").pop() || "";
      const decodedName = decodeURIComponent(name);
      const topics = db.listTopics(decodedName);

      if (topics.length === 0) {
        const sources = db.listSources();
        const available = sources.map((s) => s.source).join(", ");
        return {
          contents: [
            {
              uri: uri.href,
              text: `Source "${decodedName}" not found. Available sources: ${available}`,
              mimeType: "text/plain",
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

      let md = `# ${decodedName} — Documentation\n\n`;
      md += `**${topics.length} documents indexed**\n\n`;

      for (const [dir, items] of Object.entries(grouped)) {
        md += `## ${dir}/\n`;
        for (const item of items) {
          md += `- **${item.title}** — \`${item.path}\`\n`;
        }
        md += "\n";
      }

      return { contents: [{ uri: uri.href, text: md, mimeType: "text/markdown" }] };
    }
  );

  // Resource template: get a specific document
  server.resource(
    "document",
    "cardano://doc/{source}/{path}",
    {
      description:
        "Full content of a specific documentation page (e.g. cardano://doc/Aiken/getting-started.md)",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const parts = uri.pathname.split("/").filter(Boolean);
      // parts: ["doc", "source", ...pathParts]
      const source = decodeURIComponent(parts[1] || "");
      const path = parts.slice(2).map(decodeURIComponent).join("/");

      const doc = db.getDocByPath(source, path);
      if (!doc) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Document not found: ${source}/${path}`,
              mimeType: "text/plain",
            },
          ],
        };
      }

      let md = `# [${doc.source}] ${doc.title}\n`;
      md += `**Path:** ${doc.path}\n`;
      if (doc.url) md += `**URL:** ${doc.url}\n`;
      md += `\n${doc.content}`;

      return { contents: [{ uri: uri.href, text: md, mimeType: "text/markdown" }] };
    }
  );
}
