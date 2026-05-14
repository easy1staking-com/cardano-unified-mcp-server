import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";
import { chunkDocuments, type RawDoc } from "../src/ingest/chunker.js";
import { resolveFormat } from "../src/ingest/formats/index.js";
import type { DocSource } from "../src/config/sources.js";

const SKILLS_PATH = "/Users/giovanni/Development/workspace/cardano-dev-skills";
const VENDOR_ROOT = join(SKILLS_PATH, "docs", "sources");
const REGISTRY = join(SKILLS_PATH, "registry", "sources.yaml");

const TARGETS = ["Aiken", "PyCardano", "Mesh SDK", "Evolution SDK", "CIPs"];

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function adaptSkillsEntry(s: any): DocSource {
  return {
    name: s.name,
    repo: s.repo,
    docsPath: ".",
    format: s.format,
    formatOverrides: s.format_overrides,
    category: s.category,
    globPatterns: s.glob_patterns,
    description: s.description,
  } as DocSource;
}

async function ingestOne(source: DocSource): Promise<{
  filesMatched: number;
  filesRead: number;
  totalChars: number;
  chunks: number;
  avgChunkChars: number;
  perFormat: Record<string, number>;
  sample?: { title: string; firstLine: string };
}> {
  const vendoredDir = join(VENDOR_ROOT, slug(source.name));
  if (!existsSync(vendoredDir)) {
    throw new Error(`Vendored dir not found: ${vendoredDir}`);
  }

  const defaultPatterns: Record<string, string[]> = {
    markdown: ["**/*.md"],
    mdx: ["**/*.md", "**/*.mdx"],
    rst: ["**/*.rst"],
    openapi: ["**/*.yaml", "**/*.yml", "**/*.json"],
    aiken: ["**/*.ak"],
    toml: ["**/*.toml"],
    python: ["**/*.py"],
  };

  const patterns =
    source.globPatterns || defaultPatterns[source.format] || ["**/*.md"];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: vendoredDir,
      nodir: true,
      ignore: ["**/CHANGELOG.md", "**/LICENSE*"],
    });
    files.push(...matches);
  }
  const uniqueFiles = [...new Set(files)];

  const rawDocs: RawDoc[] = [];
  let totalChars = 0;
  const perFormat: Record<string, number> = {};

  for (const file of uniqueFiles) {
    const full = join(vendoredDir, file);
    try {
      const stat = statSync(full);
      if (stat.size > 500_000) continue;
      const content = readFileSync(full, "utf-8");
      if (content.trim().length < 100) continue;

      const format = resolveFormat(file, source);
      perFormat[format] = (perFormat[format] || 0) + 1;
      totalChars += content.length;

      rawDocs.push({
        source: source.name,
        category: source.category,
        path: file,
        content,
        format,
      });
    } catch {
      // ignore unreadable
    }
  }

  const chunks = chunkDocuments(rawDocs);
  const avgChunkChars = chunks.length
    ? Math.round(chunks.reduce((a, c) => a + c.content.length, 0) / chunks.length)
    : 0;

  let sample: { title: string; firstLine: string } | undefined;
  if (chunks.length > 0) {
    const mid = chunks[Math.floor(chunks.length / 2)];
    sample = {
      title: mid.title,
      firstLine: mid.content.split("\n")[0].slice(0, 150),
    };
  }

  return {
    filesMatched: uniqueFiles.length,
    filesRead: rawDocs.length,
    totalChars,
    chunks: chunks.length,
    avgChunkChars,
    perFormat,
    sample,
  };
}

async function main() {
  const registry = parseYaml(readFileSync(REGISTRY, "utf-8")) as any[];

  console.log("# Spike — chunking skills' vendored output");
  console.log("");
  console.log(`Vendor root: ${VENDOR_ROOT}`);
  console.log("");
  console.log(
    "| Source | Files (matched/read) | Chars | Chunks | Avg chunk | Per-format | Status |"
  );
  console.log("|---|---|---|---|---|---|---|");

  for (const target of TARGETS) {
    const entry = registry.find((s) => s.name === target);
    if (!entry) {
      console.log(`| ${target} | — | — | — | — | — | **MISSING in registry** |`);
      continue;
    }
    const source = adaptSkillsEntry(entry);
    try {
      const r = await ingestOne(source);
      const fmtSummary = Object.entries(r.perFormat)
        .map(([f, n]) => `${f}:${n}`)
        .join(" ");
      const status = r.chunks === 0 ? "**ZERO CHUNKS**" : "OK";
      console.log(
        `| ${target} | ${r.filesMatched}/${r.filesRead} | ${r.totalChars.toLocaleString()} | ${r.chunks} | ${r.avgChunkChars} | ${fmtSummary} | ${status} |`
      );
    } catch (err) {
      console.log(`| ${target} | — | — | — | — | — | **ERROR: ${(err as Error).message}** |`);
    }
  }

  console.log("");
  console.log("## Sample chunks (mid-list, per source)");
  for (const target of TARGETS) {
    const entry = registry.find((s) => s.name === target);
    if (!entry) continue;
    const source = adaptSkillsEntry(entry);
    try {
      const r = await ingestOne(source);
      if (r.sample) {
        console.log(`\n**${target}**`);
        console.log(`  title: ${r.sample.title}`);
        console.log(`  first line: ${r.sample.firstLine}`);
      }
    } catch {
      // already reported
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
