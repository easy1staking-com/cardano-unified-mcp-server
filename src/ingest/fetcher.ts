import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { glob } from "glob";
import { config } from "../config/env.js";
import type { DocSource } from "../config/sources.js";
import type { RawDoc } from "./chunker.js";
import { resolveFormat } from "./formats/index.js";

/**
 * Phase 1: Resolve a source to its on-disk location inside the
 * cardano-dev-skills checkout. Skills already cloned the upstream repo
 * and vendored its docs under docs/sources/<slug>/, stripping the
 * source's docs_path prefix. So the directory returned here IS the
 * docs root — readSourceFiles does NOT need to join docsPath again.
 */
export function resolveSourceDir(source: DocSource): string {
  const dir = join(config.skillsPath, "docs", "sources", source.slug);
  if (!existsSync(dir)) {
    throw new Error(
      `Vendored content not found for "${source.name}" at ${dir}.\n` +
        `Run skills' fetch script (scripts/fetch-docs.sh --source "${source.name}") or pull a newer skills checkout.`
    );
  }
  return dir;
}

/**
 * Phase 2: Read files from the vendored skills directory, resolve format
 * per file, and return RawDocs ready for chunking.
 */
export async function readSourceFiles(
  source: DocSource,
  docsDir: string
): Promise<RawDoc[]> {
  if (!existsSync(docsDir)) {
    console.warn(`  Warning: docs dir not found: ${docsDir}`);
    return [];
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
      cwd: docsDir,
      nodir: true,
      ignore: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/CHANGELOG.md",
        "**/CONTRIBUTING.md",
        "**/LICENSE*",
      ],
    });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];
  const docs: RawDoc[] = [];

  for (const file of uniqueFiles) {
    const fullPath = join(docsDir, file);
    try {
      const stat = statSync(fullPath);
      if (stat.size > 500_000) {
        console.log(
          `  Skipping large file: ${file} (${(stat.size / 1024).toFixed(0)}KB)`
        );
        continue;
      }

      const content = readFileSync(fullPath, "utf-8");
      if (content.trim().length < 100) continue;

      const format = resolveFormat(file, source);

      docs.push({
        source: source.name,
        category: source.category,
        path: file,
        content,
        format,
        url: buildUrl(source.repo, source.docsPath, file),
      });
    } catch (err) {
      console.warn(`  Error reading ${file}:`, (err as Error).message);
    }
  }

  console.log(`  Read ${docs.length} files from ${source.name}`);
  return docs;
}

function buildUrl(repo: string, docsPath: string, file: string): string {
  const base = repo.replace(/\.git$/, "");
  const prefix = docsPath === "." ? "" : `${docsPath}/`;
  return `${base}/blob/main/${prefix}${file}`;
}
