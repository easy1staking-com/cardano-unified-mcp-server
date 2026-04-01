/**
 * Evaluation harness for the Cardano Unified MCP Server.
 *
 * Usage:
 *   npm run eval                          # Run queries, print results
 *   npm run eval -- --snapshot            # Run queries and save snapshot
 *   npm run eval -- --compare <file>      # Compare current results against a snapshot
 *   npm run eval -- --keyword-only        # Run without embeddings API
 *   npm run eval -- --tag "v0.2.0"        # Tag the snapshot with a label
 *
 * Snapshots are saved to eval/snapshots/ with a timestamp and optional tag.
 * Commit them to git to track quality over time.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { VectorDB } from "../src/db/vectordb.js";
import { generateEmbedding } from "../src/db/embeddings.js";
import { config } from "../src/config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvalQuery {
  id: string;
  query: string;
  expectedSources: string[];
  category: string | null;
  mode: "hybrid" | "semantic" | "keyword";
  description: string;
}

interface ResultEntry {
  id: string;
  source: string;
  title: string;
  score: number;
  contentPreview: string;
}

interface QueryResult {
  queryId: string;
  query: string;
  mode: string;
  category: string | null;
  expectedSources: string[];
  results: ResultEntry[];
  topSourceMatch: boolean; // expected source appears in top-3
  timestamp: string;
}

interface Snapshot {
  version: string;
  tag: string;
  timestamp: string;
  dbStats: { total_chunks: number; sources: number; categories: number };
  queries: QueryResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    avgResultCount: number;
  };
}

// ---------------------------------------------------------------------------
// Search logic (mirrors src/tools/docs.ts)
// ---------------------------------------------------------------------------

function buildFtsQuery(query: string): string {
  return query
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => `"${w}"`)
    .join(" OR ");
}

async function runSearch(
  db: VectorDB,
  query: string,
  mode: string,
  category: string | null,
  keywordOnly: boolean
): Promise<ResultEntry[]> {
  const limit = 5;
  const fetchLimit = limit * 2;
  const cat = category || undefined;

  let results;

  if (mode === "keyword" || keywordOnly || !config.embeddingsApiKey) {
    const ftsQuery = buildFtsQuery(query);
    results = db.searchFTS(ftsQuery, fetchLimit, cat);
  } else if (mode === "semantic") {
    const embedding = await generateEmbedding(query);
    results = db.searchVector(embedding, fetchLimit, cat);
  } else {
    // Hybrid
    const ftsQuery = buildFtsQuery(query);
    const ftsResults = db.searchFTS(ftsQuery, fetchLimit * 2, cat);

    let vectorResults: typeof ftsResults = [];
    if (config.embeddingsApiKey) {
      const embedding = await generateEmbedding(query);
      vectorResults = db.searchVector(embedding, fetchLimit * 2, cat);
    }

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

    results = [...seen.values()].sort((a, b) => b.score - a.score);
  }

  return results.slice(0, limit).map((r) => ({
    id: r.id,
    source: r.source,
    title: r.title,
    score: Math.round(r.score * 1000) / 1000,
    contentPreview: r.content.slice(0, 200).replace(/\n/g, " "),
  }));
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

interface ComparisonRow {
  queryId: string;
  oldTop: string;
  newTop: string;
  oldScore: number;
  newScore: number;
  scoreDelta: number;
  oldPassed: boolean;
  newPassed: boolean;
  status: "OK" | "IMPROVED" | "REGRESSION" | "NEW_FAIL" | "NEW_PASS";
}

function compare(oldSnap: Snapshot, newSnap: Snapshot): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  const oldMap = new Map(oldSnap.queries.map((q) => [q.queryId, q]));

  for (const nq of newSnap.queries) {
    const oq = oldMap.get(nq.queryId);

    const newTop = nq.results[0]?.source || "(none)";
    const newScore = nq.results[0]?.score || 0;
    const oldTop = oq?.results[0]?.source || "(none)";
    const oldScore = oq?.results[0]?.score || 0;
    const oldPassed = oq?.topSourceMatch ?? false;
    const newPassed = nq.topSourceMatch;

    let status: ComparisonRow["status"] = "OK";
    if (!oldPassed && newPassed) status = "NEW_PASS";
    else if (oldPassed && !newPassed) status = "NEW_FAIL";
    else if (newScore > oldScore + 0.05) status = "IMPROVED";
    else if (newScore < oldScore - 0.05) status = "REGRESSION";

    rows.push({
      queryId: nq.queryId,
      oldTop,
      newTop,
      oldScore,
      newScore,
      scoreDelta: Math.round((newScore - oldScore) * 1000) / 1000,
      oldPassed,
      newPassed,
      status,
    });
  }

  return rows;
}

function printComparison(
  rows: ComparisonRow[],
  oldSnap: Snapshot,
  newSnap: Snapshot
): void {
  console.log(`\n  Comparing: ${oldSnap.tag || oldSnap.version} → ${newSnap.tag || newSnap.version}`);
  console.log(`  Old: ${oldSnap.dbStats.total_chunks} chunks, ${oldSnap.dbStats.sources} sources`);
  console.log(`  New: ${newSnap.dbStats.total_chunks} chunks, ${newSnap.dbStats.sources} sources\n`);

  // Table header
  const h = {
    id: "Query".padEnd(24),
    oldTop: "Old Top Source".padEnd(22),
    newTop: "New Top Source".padEnd(22),
    delta: "Δ Score",
    status: "Status",
  };
  console.log(`  ${h.id} ${h.oldTop} ${h.newTop} ${h.delta.padStart(8)} ${h.status}`);
  console.log(`  ${"─".repeat(90)}`);

  for (const r of rows) {
    const icon =
      r.status === "NEW_FAIL"
        ? "FAIL"
        : r.status === "REGRESSION"
          ? "REGR"
          : r.status === "NEW_PASS"
            ? "PASS"
            : r.status === "IMPROVED"
              ? "IMPR"
              : "  OK";

    console.log(
      `  ${r.queryId.padEnd(24)} ${r.oldTop.padEnd(22)} ${r.newTop.padEnd(22)} ${(r.scoreDelta >= 0 ? "+" : "") + r.scoreDelta.toFixed(3).padStart(7)} ${icon}`
    );
  }

  const fails = rows.filter((r) => r.status === "NEW_FAIL");
  const regressions = rows.filter((r) => r.status === "REGRESSION");
  const improvements = rows.filter((r) => r.status === "IMPROVED" || r.status === "NEW_PASS");

  console.log(`\n  Summary: ${improvements.length} improved, ${regressions.length} regressions, ${fails.length} new failures`);

  if (fails.length > 0) {
    console.error(`\n  NEW FAILURES (expected source no longer in top-3):`);
    for (const f of fails) {
      console.error(`    ${f.queryId}: was "${f.oldTop}", now "${f.newTop}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const doSnapshot = args.includes("--snapshot");
  const keywordOnly = args.includes("--keyword-only");
  const compareFile = args.find((_, i) => args[i - 1] === "--compare");
  const tag = args.find((_, i) => args[i - 1] === "--tag") || "";

  // Load queries
  const queriesPath = join(__dirname, "queries.json");
  const queries: EvalQuery[] = JSON.parse(readFileSync(queriesPath, "utf-8"));

  console.log(`\nCardano Unified MCP — Evaluation Harness`);
  console.log(`========================================`);
  console.log(`Queries: ${queries.length}`);
  console.log(`Mode: ${keywordOnly ? "keyword-only" : "as declared per query"}`);
  if (tag) console.log(`Tag: ${tag}`);

  const db = new VectorDB();
  const stats = db.getStats();
  console.log(`Database: ${stats.total_chunks} chunks, ${stats.sources} sources, ${stats.categories} categories\n`);

  // Run all queries
  const queryResults: QueryResult[] = [];
  let passCount = 0;
  let totalScore = 0;
  let totalResults = 0;

  for (const q of queries) {
    process.stdout.write(`  Running: ${q.id.padEnd(24)} `);

    const results = await runSearch(db, q.query, q.mode, q.category, keywordOnly);

    // Check if any expected source appears in top-3
    const top3Sources = results.slice(0, 3).map((r) => r.source.toLowerCase());
    const topSourceMatch = q.expectedSources.some((es) =>
      top3Sources.some((t3) => t3.includes(es.toLowerCase()))
    );

    if (topSourceMatch) passCount++;
    if (results.length > 0) totalScore += results[0].score;
    totalResults += results.length;

    const icon = topSourceMatch ? "PASS" : results.length === 0 ? "EMPTY" : "MISS";
    const topResult = results[0]
      ? `${results[0].source} (${results[0].score})`
      : "(no results)";
    console.log(`${icon}  top: ${topResult}`);

    queryResults.push({
      queryId: q.id,
      query: q.query,
      mode: q.mode,
      category: q.category,
      expectedSources: q.expectedSources,
      results,
      topSourceMatch,
      timestamp: new Date().toISOString(),
    });
  }

  // Summary
  const summary = {
    total: queries.length,
    passed: passCount,
    failed: queries.length - passCount,
    avgScore: Math.round((totalScore / queries.length) * 1000) / 1000,
    avgResultCount: Math.round((totalResults / queries.length) * 10) / 10,
  };

  console.log(`\n  ────────────────────────────────────────────`);
  console.log(`  Pass rate: ${summary.passed}/${summary.total} (${Math.round((summary.passed / summary.total) * 100)}%)`);
  console.log(`  Avg top score: ${summary.avgScore}`);
  console.log(`  Avg result count: ${summary.avgResultCount}`);

  // Build snapshot object
  const snapshot: Snapshot = {
    version: "0.2.0",
    tag,
    timestamp: new Date().toISOString(),
    dbStats: stats,
    queries: queryResults,
    summary,
  };

  // Save snapshot
  if (doSnapshot) {
    const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const filename = tag ? `${date}-${tag}.json` : `${date}.json`;
    const snapshotPath = join(__dirname, "snapshots", filename);
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log(`\n  Snapshot saved: eval/snapshots/${filename}`);
    console.log(`  Commit this file to track quality over time.`);
  }

  // Compare against baseline
  if (compareFile) {
    const baselinePath = compareFile.startsWith("/")
      ? compareFile
      : join(__dirname, "snapshots", compareFile);

    if (!existsSync(baselinePath)) {
      console.error(`\n  Baseline not found: ${baselinePath}`);
      process.exit(1);
    }

    const baseline: Snapshot = JSON.parse(readFileSync(baselinePath, "utf-8"));
    const rows = compare(baseline, snapshot);
    printComparison(rows, baseline, snapshot);

    const newFails = rows.filter((r) => r.status === "NEW_FAIL");
    if (newFails.length > 0) {
      console.error(`\n  QUALITY REGRESSION DETECTED — ${newFails.length} queries lost expected source.`);
      process.exit(1);
    }
  }

  db.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
