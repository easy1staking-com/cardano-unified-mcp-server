import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { config } from "./env.js";

export type DocFormat =
  | "markdown"
  | "mdx"
  | "rst"
  | "openapi"
  | "aiken"
  | "toml"
  | "python";

export type DocCategory =
  | "infrastructure"
  | "smart-contracts"
  | "sdk"
  | "standards"
  | "governance"
  | "scaling"
  | "testing"
  | "oracles";

export interface DocSource {
  name: string;
  repo: string;
  docsPath: string;
  format: DocFormat;
  formatOverrides?: Record<string, DocFormat>;
  category: DocCategory;
  branch?: string;
  globPatterns?: string[];
  description?: string;
  /** Slug used to locate vendored content under skills' docs/sources/<slug>/. */
  slug: string;
}

const DocFormatSchema = z.enum([
  "markdown",
  "mdx",
  "rst",
  "openapi",
  "aiken",
  "toml",
  "python",
]);

const DocCategorySchema = z.enum([
  "infrastructure",
  "smart-contracts",
  "sdk",
  "standards",
  "governance",
  "scaling",
  "testing",
  "oracles",
]);

// Schema for one entry in skills' registry/sources.yaml — snake_case fields.
const SkillsEntrySchema = z.object({
  name: z.string().min(1),
  repo: z.string().url(),
  docs_path: z.string().min(1),
  format: DocFormatSchema,
  format_overrides: z.record(DocFormatSchema).optional(),
  category: DocCategorySchema,
  branch: z.string().optional(),
  glob_patterns: z.array(z.string()).optional(),
  description: z.string().optional(),
  // Skills-only fields we don't use; tolerated, not required.
  priority: z.string().optional(),
  website: z.string().optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadSources(): DocSource[] {
  const registryPath = join(config.skillsPath, "registry", "sources.yaml");
  if (!existsSync(registryPath)) {
    throw new Error(
      `Skills registry not found at ${registryPath}.\n` +
        `Set SKILLS_PATH to a cardano-dev-skills checkout, or clone it as a sibling directory.`
    );
  }

  const raw = readFileSync(registryPath, "utf8");
  const parsed = parseYaml(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Expected ${registryPath} to be a top-level YAML list of source entries.`
    );
  }

  const sources: DocSource[] = [];
  const names = new Set<string>();
  const issues: string[] = [];

  parsed.forEach((entry, idx) => {
    const result = SkillsEntrySchema.safeParse(entry);
    if (!result.success) {
      const path = entry && typeof entry === "object" && entry.name
        ? `"${entry.name}"`
        : `index ${idx}`;
      const detail = result.error.issues
        .map((i) => `    - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      issues.push(`  ${path}:\n${detail}`);
      return;
    }
    if (names.has(result.data.name)) {
      issues.push(`  Duplicate name: "${result.data.name}"`);
      return;
    }
    names.add(result.data.name);
    sources.push({
      name: result.data.name,
      repo: result.data.repo,
      docsPath: result.data.docs_path,
      format: result.data.format,
      formatOverrides: result.data.format_overrides,
      category: result.data.category,
      branch: result.data.branch,
      globPatterns: result.data.glob_patterns,
      description: result.data.description,
      slug: slugify(result.data.name),
    });
  });

  if (issues.length > 0) {
    throw new Error(
      `Invalid entries in ${registryPath}:\n${issues.join("\n")}`
    );
  }

  return sources;
}

export const DOC_SOURCES: DocSource[] = loadSources();
