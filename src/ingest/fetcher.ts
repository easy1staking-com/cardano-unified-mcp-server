import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";
import { glob } from "glob";
import { config } from "../config/env.js";
import type { DocSource } from "../config/sources.js";
import type { RawDoc } from "./chunker.js";

export async function fetchSource(source: DocSource): Promise<RawDoc[]> {
  const repoDir = join(config.reposDir, sanitizeName(source.name));

  // Clone or pull
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
  };

  const patterns = source.globPatterns || defaultPatterns[source.format] || ["**/*.md"];
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
        console.log(`  Skipping large file: ${file} (${(stat.size / 1024).toFixed(0)}KB)`);
        continue;
      }

      let content = readFileSync(fullPath, "utf-8");

      // Strip frontmatter
      content = stripFrontmatter(content);

      // Strip MDX/JSX components (keep text content)
      if (extname(file) === ".mdx") {
        content = stripMDX(content);
      }

      if (content.trim().length < 100) continue;

      docs.push({
        source: source.name,
        category: source.category,
        path: file,
        content,
        url: buildUrl(source.repo, source.docsPath, file),
      });
    } catch (err) {
      console.warn(`  Error reading ${file}:`, (err as Error).message);
    }
  }

  console.log(`  Extracted ${docs.length} docs from ${source.name}`);
  return docs;
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      return content.slice(end + 3).trim();
    }
  }
  return content;
}

function stripMDX(content: string): string {
  // Remove import statements
  content = content.replace(/^import\s+.*$/gm, "");
  // Remove export statements (but keep default export content)
  content = content.replace(/^export\s+(default\s+)?/gm, "");
  // Remove JSX self-closing tags
  content = content.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, "");
  // Remove JSX opening/closing tags but keep children
  content = content.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, "");
  // Remove {expressions} but keep simple string content
  content = content.replace(/\{`([^`]*)`\}/g, "$1");
  return content;
}

function buildUrl(repo: string, docsPath: string, file: string): string {
  // Convert git URL to GitHub raw URL
  const base = repo
    .replace(/\.git$/, "")
    .replace("https://github.com/", "https://github.com/");
  return `${base}/blob/main/${docsPath}/${file}`;
}
