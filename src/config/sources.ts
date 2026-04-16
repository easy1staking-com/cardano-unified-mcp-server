import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

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

const DocSourceSchema = z.object({
  name: z.string().min(1),
  repo: z.string().url(),
  docsPath: z.string().min(1),
  format: DocFormatSchema,
  formatOverrides: z.record(DocFormatSchema).optional(),
  category: DocCategorySchema,
  branch: z.string().optional(),
  globPatterns: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const SourcesFileSchema = z.object({
  sources: z.array(DocSourceSchema).min(1),
});

function loadSources(): DocSource[] {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/config/sources.ts lives at src/config/, YAML at <repo>/config/sources.yaml
  // At runtime (dist/config/sources.js) we still resolve two levels up to repo root.
  const yamlPath = resolve(here, "../../config/sources.yaml");
  const raw = readFileSync(yamlPath, "utf8");
  const parsed = parseYaml(raw);
  const result = SourcesFileSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid config/sources.yaml:\n${issues}\n\nSee docs/sources-schema.md for the schema reference.`
    );
  }
  const names = new Set<string>();
  for (const s of result.data.sources) {
    if (names.has(s.name)) {
      throw new Error(
        `Duplicate source name in config/sources.yaml: "${s.name}". Names must be unique.`
      );
    }
    names.add(s.name);
  }
  return result.data.sources;
}

export const DOC_SOURCES: DocSource[] = loadSources();
