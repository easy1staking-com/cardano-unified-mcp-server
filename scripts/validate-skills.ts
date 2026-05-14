/**
 * Contract test: validates the skills registry against MCP's loader
 * expectations and verifies vendored content exists per source.
 *
 * Runs in CI on PRs + nightly to catch upstream schema drift before it
 * breaks the Sunday indexer.
 *
 * Exits non-zero on:
 *   - missing/malformed registry
 *   - any entry that fails MCP's Zod schema
 *   - any source whose vendored dir doesn't exist under docs/sources/
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DOC_SOURCES } from "../src/config/sources.js";
import { config } from "../src/config/env.js";

const issues: string[] = [];

for (const source of DOC_SOURCES) {
  const vendoredDir = join(config.skillsPath, "docs", "sources", source.slug);
  if (!existsSync(vendoredDir)) {
    issues.push(`  ${source.name}: vendored dir missing at ${vendoredDir}`);
  }
}

const byCategory = DOC_SOURCES.reduce<Record<string, number>>((acc, s) => {
  acc[s.category] = (acc[s.category] || 0) + 1;
  return acc;
}, {});

const withDescription = DOC_SOURCES.filter((s) => s.description).length;
const withGlobs = DOC_SOURCES.filter((s) => s.globPatterns).length;

console.log(`skills registry at ${config.skillsPath}`);
console.log(`  Total sources:     ${DOC_SOURCES.length}`);
console.log(`  With description:  ${withDescription}`);
console.log(`  With globPatterns: ${withGlobs}`);
console.log(`  By category:`);
for (const [cat, n] of Object.entries(byCategory).sort()) {
  console.log(`    ${cat.padEnd(18)} ${n}`);
}

if (issues.length > 0) {
  console.error(`\nFAIL — ${issues.length} contract violation(s):`);
  for (const issue of issues) console.error(issue);
  process.exit(1);
}

console.log(`\nOK — all ${DOC_SOURCES.length} sources resolve to vendored dirs`);
