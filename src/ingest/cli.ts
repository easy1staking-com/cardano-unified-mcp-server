import { DOC_SOURCES, type DocSource } from "../config/sources.js";
import { VectorDB, type DocChunk } from "../db/vectordb.js";
import { generateEmbeddingsBatch } from "../db/embeddings.js";
import { fetchSource } from "./fetcher.js";
import { chunkDocuments } from "./chunker.js";
import { config } from "../config/env.js";

async function main() {
  const args = process.argv.slice(2);
  const sourceFilter = args.find((a) => !a.startsWith("--"));
  const skipEmbeddings = args.includes("--skip-embeddings");
  const priorityFilter = args.find((a) => a.startsWith("--priority="))?.split("=")[1];

  let sources = DOC_SOURCES;

  if (sourceFilter) {
    sources = sources.filter(
      (s) => s.name.toLowerCase().includes(sourceFilter.toLowerCase())
    );
    if (sources.length === 0) {
      console.error(`No sources matching "${sourceFilter}"`);
      process.exit(1);
    }
  }

  if (priorityFilter) {
    sources = sources.filter((s) => s.priority === priorityFilter);
  }

  console.log(`\nCardano Unified MCP — Documentation Ingestion`);
  console.log(`==============================================`);
  console.log(`Sources to process: ${sources.length}`);
  console.log(`Database: ${config.dbPath}`);
  console.log(`Embeddings: ${skipEmbeddings ? "SKIPPED" : config.embeddingsModel}`);
  console.log();

  const db = new VectorDB();

  for (const source of sources) {
    console.log(`\n[${source.priority.toUpperCase()}] ${source.name} (${source.category})`);

    try {
      // Fetch docs
      const rawDocs = await fetchSource(source);
      if (rawDocs.length === 0) {
        console.log(`  No documents found, skipping.`);
        continue;
      }

      // Chunk
      const chunks = chunkDocuments(rawDocs);
      console.log(`  Chunked into ${chunks.length} pieces`);

      // Generate embeddings
      let embeddings: number[][] | null = null;
      if (!skipEmbeddings && config.embeddingsApiKey) {
        console.log(`  Generating embeddings...`);
        const texts = chunks.map(
          (c) => `${c.source} — ${c.title}\n\n${c.content}`
        );
        embeddings = await generateEmbeddingsBatch(texts);
        console.log(`  Generated ${embeddings.length} embeddings`);
      }

      // Store
      const docChunks: DocChunk[] = chunks.map((c, i) => ({
        ...c,
        embedding: embeddings ? embeddings[i] : undefined,
      }));

      // Clear old data for this source and insert new
      db.deleteSource(source.name);
      db.upsertChunks(docChunks);
      console.log(`  Stored ${docChunks.length} chunks`);
    } catch (err) {
      console.error(`  ERROR processing ${source.name}:`, (err as Error).message);
    }
  }

  const stats = db.getStats();
  console.log(`\n==============================================`);
  console.log(`Done! Total: ${stats.total_chunks} chunks from ${stats.sources} sources across ${stats.categories} categories`);

  db.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
