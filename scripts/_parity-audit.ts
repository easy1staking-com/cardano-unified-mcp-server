import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";

const MCP_PATH =
  "/Users/giovanni/Development/workspace/cardano-unified-mcp-server/config/sources.yaml";
const SKILLS_PATH =
  "/Users/giovanni/Development/workspace/cardano-dev-skills/registry/sources.yaml";

const FORMAT_EXTS: Record<string, string[]> = {
  markdown: [".md"],
  mdx: [".md", ".mdx"],
  aiken: [".ak"],
  python: [".py"],
  rst: [".rst"],
  toml: [".toml"],
  openapi: [".yaml", ".yml", ".json"],
};

type Source = {
  name: string;
  format?: string;
  formatOverrides?: Record<string, string>;
  globPatterns?: string[];
  category?: string;
};

function readSources(path: string, root?: string): Source[] {
  const text = readFileSync(path, "utf-8");
  const doc = parseYaml(text);
  const arr = root ? doc[root] : doc;
  return arr.map((s: any) => ({
    name: s.name,
    format: s.format,
    formatOverrides: s.formatOverrides || s.format_overrides,
    globPatterns: s.globPatterns || s.glob_patterns,
    category: s.category,
  }));
}

function expectedExts(s: Source): Set<string> {
  // Explicit globs are ground truth — they describe exactly what MCP chunks.
  if (s.globPatterns && s.globPatterns.length > 0) {
    return vendoredExts(s);
  }
  const exts = new Set<string>();
  if (s.format && FORMAT_EXTS[s.format]) {
    FORMAT_EXTS[s.format].forEach((e) => exts.add(e));
  }
  if (s.formatOverrides) {
    for (const fmt of Object.values(s.formatOverrides)) {
      (FORMAT_EXTS[fmt] || []).forEach((e) => exts.add(e));
    }
  }
  return exts;
}

function vendoredExts(s: Source): Set<string> {
  const exts = new Set<string>();
  const patterns = s.globPatterns || [];
  for (const p of patterns) {
    const m = p.match(/\.([a-zA-Z0-9]+)$/);
    if (m) exts.add("." + m[1].toLowerCase());
  }
  if (patterns.length === 0 && s.format && FORMAT_EXTS[s.format]) {
    FORMAT_EXTS[s.format].forEach((e) => exts.add(e));
  }
  return exts;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const mcp = readSources(MCP_PATH, "sources");
const skills = readSources(SKILLS_PATH);

const skillsByName = new Map<string, Source>();
const skillsBySlug = new Map<string, Source>();
for (const s of skills) {
  skillsByName.set(s.name.toLowerCase(), s);
  skillsBySlug.set(slug(s.name), s);
}

const matched: Array<{
  name: string;
  mcp: Source;
  sk: Source;
  expected: Set<string>;
  vendored: Set<string>;
  missing: string[];
}> = [];
const mcpOnly: Source[] = [];

for (const m of mcp) {
  const sk =
    skillsByName.get(m.name.toLowerCase()) || skillsBySlug.get(slug(m.name));
  if (!sk) {
    mcpOnly.push(m);
    continue;
  }
  const exp = expectedExts(m);
  const vend = vendoredExts(sk);
  const missing = [...exp].filter((e) => !vend.has(e));
  matched.push({
    name: m.name,
    mcp: m,
    sk,
    expected: exp,
    vendored: vend,
    missing,
  });
}

const skillsNamesMatched = new Set(matched.map((m) => m.sk.name.toLowerCase()));
const skillsOnly = skills.filter(
  (s) => !skillsNamesMatched.has(s.name.toLowerCase())
);

console.log("# Parity Audit — MCP ↔ Skills");
console.log("");
console.log(`MCP sources:    ${mcp.length}`);
console.log(`Skills sources: ${skills.length}`);
console.log(`Matched:        ${matched.length}`);
console.log(`MCP-only:       ${mcpOnly.length}`);
console.log(`Skills-only:    ${skillsOnly.length}`);
console.log("");

console.log("## Parity gaps (skills vendoring is missing extensions MCP wants)");
console.log("");
const gaps = matched.filter((m) => m.missing.length > 0);
if (gaps.length === 0) {
  console.log("_(none — skills' globs cover every extension MCP wants to chunk)_");
} else {
  console.log("| Source | MCP format | MCP expects | Skills vendors | Missing |");
  console.log("|---|---|---|---|---|");
  for (const g of gaps) {
    const fmt = g.mcp.format + (g.mcp.formatOverrides ? " + overrides" : "");
    console.log(
      `| ${g.name} | ${fmt} | ${[...g.expected].join(", ")} | ${[...g.vendored].join(", ")} | **${g.missing.join(", ")}** |`
    );
  }
}
console.log("");

console.log("## MCP-only sources (not present in skills)");
console.log("");
if (mcpOnly.length === 0) {
  console.log("_(none)_");
} else {
  console.log("| Source | Category | Format |");
  console.log("|---|---|---|");
  for (const m of mcpOnly) {
    console.log(`| ${m.name} | ${m.category} | ${m.format} |`);
  }
}
console.log("");

console.log("## Skills-only sources (not yet in MCP)");
console.log("");
if (skillsOnly.length === 0) {
  console.log("_(none)_");
} else {
  console.log("| Source | Category | Skills format |");
  console.log("|---|---|---|");
  for (const s of skillsOnly) {
    console.log(`| ${s.name} | ${s.category} | ${s.format} |`);
  }
}
console.log("");

console.log("## Sanity check — top 5 matched entries");
console.log("");
console.log("| Source | MCP format/overrides | MCP globs (n) | Skills globs (n) | Status |");
console.log("|---|---|---|---|---|");
for (const m of matched.slice(0, 5)) {
  const fmt = m.mcp.format + (m.mcp.formatOverrides ? "+ov" : "");
  console.log(
    `| ${m.name} | ${fmt} | ${(m.mcp.globPatterns || []).length} | ${(m.sk.globPatterns || []).length} | ${m.missing.length === 0 ? "OK" : "GAP"} |`
  );
}
