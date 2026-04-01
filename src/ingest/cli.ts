import { DOC_SOURCES, type DocSource } from "../config/sources.js";
import { VectorDB, type DocChunk } from "../db/vectordb.js";
import { generateEmbeddingsBatch } from "../db/embeddings.js";
import { cloneSource, readSourceFiles } from "./fetcher.js";
import { chunkDocuments, type RawDoc } from "./chunker.js";
import { validateDocs, printValidationReport } from "./validator.js";
import { config } from "../config/env.js";

async function main() {
  const args = process.argv.slice(2);
  const sourceFilter = args.find((a) => !a.startsWith("--"));
  const skipEmbeddings = args.includes("--skip-embeddings");
  const validateOnly = args.includes("--validate-only");
  const skipValidation = args.includes("--skip-validation");
  const priorityFilter = args
    .find((a) => a.startsWith("--priority="))
    ?.split("=")[1];

  let sources = DOC_SOURCES;

  if (sourceFilter) {
    sources = sources.filter((s) =>
      s.name.toLowerCase().includes(sourceFilter.toLowerCase())
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
  console.log(
    `Embeddings: ${skipEmbeddings || validateOnly ? "SKIPPED" : config.embeddingsModel}`
  );
  if (validateOnly) console.log(`Mode: VALIDATE ONLY (no chunking or embedding)`);
  if (skipValidation) console.log(`Mode: SKIP VALIDATION`);
  console.log();

  // =========================================================================
  // PHASE 1: FETCH — Clone/pull all repos
  // =========================================================================

  console.log(`\n=== Phase 1: Fetching ${sources.length} repositories ===\n`);

  const repoDirs = new Map<string, string>();
  const fetchErrors: Array<{ source: DocSource; error: string }> = [];

  for (const source of sources) {
    try {
      const dir = cloneSource(source);
      repoDirs.set(source.name, dir);
    } catch (err) {
      const msg = (err as Error).message;
      fetchErrors.push({ source, error: msg });
      console.error(`  ERROR cloning ${source.name}: ${msg}`);
    }
  }

  if (fetchErrors.length > 0) {
    console.error(
      `\n  ${fetchErrors.length} source(s) failed to clone. Continuing with ${repoDirs.size} available.\n`
    );
  }

  // =========================================================================
  // PHASE 2: READ + VALIDATE — Read files, check formats, FAIL LOUD
  // =========================================================================

  console.log(`\n=== Phase 2: Reading & validating files ===\n`);

  const allRawDocs = new Map<
    string,
    { source: DocSource; docs: RawDoc[] }
  >();

  for (const source of sources) {
    const repoDir = repoDirs.get(source.name);
    if (!repoDir) continue; // skipped due to clone error

    const docs = await readSourceFiles(source, repoDir);
    if (docs.length === 0) {
      console.log(`  ${source.name}: no documents found, skipping.`);
      continue;
    }

    allRawDocs.set(source.name, { source, docs });
  }

  if (!skipValidation) {
    const validationResult = validateDocs(allRawDocs);
    printValidationReport(validationResult);

    if (!validationResult.valid) {
      process.exit(1);
    }
  } else {
    console.log("  Validation skipped (--skip-validation).\n");
  }

  if (validateOnly) {
    console.log("=== Validate-only mode — stopping before chunking. ===\n");
    return;
  }

  // =========================================================================
  // PHASE 3: CHUNK — Format-aware splitting
  // =========================================================================

  console.log(`=== Phase 3: Chunking ===\n`);

  const allChunks = new Map<string, { source: DocSource; chunks: ReturnType<typeof chunkDocuments> }>();

  for (const [name, { source, docs }] of allRawDocs) {
    const chunks = chunkDocuments(docs);
    allChunks.set(name, { source, chunks });
    console.log(
      `  [${source.priority.toUpperCase()}] ${name}: ${docs.length} files → ${chunks.length} chunks`
    );
  }

  // =========================================================================
  // PHASE 4: EMBED + STORE — The expensive part
  // =========================================================================

  console.log(`\n=== Phase 4: Embedding & storing ===\n`);

  const db = new VectorDB();

  for (const [name, { source, chunks }] of allChunks) {
    try {
      // Generate embeddings
      let embeddings: number[][] | null = null;
      if (!skipEmbeddings && config.embeddingsApiKey) {
        console.log(`  [${name}] Generating ${chunks.length} embeddings...`);
        const texts = chunks.map(
          (c) => `${c.source} — ${c.title}\n\n${c.content}`
        );
        embeddings = await generateEmbeddingsBatch(texts);
        console.log(`  [${name}] Generated ${embeddings.length} embeddings`);
      }

      // Store
      const docChunks: DocChunk[] = chunks.map((c, i) => ({
        ...c,
        embedding: embeddings ? embeddings[i] : undefined,
      }));

      // Clear old data for this source and insert new
      db.deleteSource(name);
      db.upsertChunks(docChunks);
      console.log(`  [${name}] Stored ${docChunks.length} chunks`);
    } catch (err) {
      console.error(
        `  ERROR processing ${name}:`,
        (err as Error).message
      );
    }
  }

  const stats = db.getStats();
  console.log(`\n==============================================`);
  console.log(
    `Done! Total: ${stats.total_chunks} chunks from ${stats.sources} sources across ${stats.categories} categories`
  );

  db.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
