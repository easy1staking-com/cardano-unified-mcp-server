import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";
import { glob } from "glob";
import { config } from "../config/env.js";
import type { DocSource } from "../config/sources.js";
import type { RawDoc } from "./chunker.js";
import { resolveFormat } from "./formats/index.js";

/**
 * Phase 1: Clone or pull a source repo. Returns the repo directory path.
 * Does NOT read any files — just ensures the repo is up to date.
 */
export function cloneSource(source: DocSource): string {
  const repoDir = join(config.reposDir, sanitizeName(source.name));

  if (existsSync(join(repoDir, ".git"))) {
    console.log(`  Pulling ${source.name}...`);
    execSync("git pull --ff-only 2>/dev/null || true", {
      cwd: repoDir,
      stdio: "pipe",
    });
  } else {
    console.log(`  Cloning ${source.name}...`);
    const branch = source.branch ? `--branch ${source.branch}` : "";
    execSync(
      `git clone --depth 1 ${branch} ${source.repo} "${repoDir}"`,
      { stdio: "pipe" }
    );
  }

  return repoDir;
}

/**
 * Phase 2: Read files from a cloned repo, resolve format per file,
 * and return RawDocs with format attached.
 */
export async function readSourceFiles(
  source: DocSource,
  repoDir: string
): Promise<RawDoc[]> {
  const docsDir = join(repoDir, source.docsPath);
  if (!existsSync(docsDir)) {
    console.warn(`  Warning: docs path not found: ${docsDir}`);
    return [];
  }

  // Collect files
  const defaultPatterns: Record<string, string[]> = {
    markdown: ["**/*.md"],
    mdx: ["**/*.md", "**/*.mdx"],
    rst: ["**/*.rst"],
    openapi: ["**/*.yaml", "**/*.yml", "**/*.json"],
    aiken: ["**/*.ak"],
    toml: ["**/*.toml"],
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

  // Deduplicate
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

      // Resolve format for this specific file
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

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildUrl(repo: string, docsPath: string, file: string): string {
  const base = repo.replace(/\.git$/, "");
  return `${base}/blob/main/${docsPath}/${file}`;
}
