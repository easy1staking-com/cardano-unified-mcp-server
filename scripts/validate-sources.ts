/**
 * Validates config/sources.yaml by importing the loader.
 * The loader runs Zod validation on import and throws with a precise
 * field path on any malformed entry.
 *
 * Prints a per-category summary so reviewers can sanity-check PR diffs.
 * Exits non-zero on any validation failure — wired into CI to block PRs.
 */
import { DOC_SOURCES } from "../src/config/sources.js";

const byCategory = DOC_SOURCES.reduce<Record<string, number>>((acc, s) => {
  acc[s.category] = (acc[s.category] || 0) + 1;
  return acc;
}, {});

const withDescription = DOC_SOURCES.filter((s) => s.description).length;
const withGlobs = DOC_SOURCES.filter((s) => s.globPatterns).length;

console.log("config/sources.yaml — OK");
console.log(`  Total sources:     ${DOC_SOURCES.length}`);
console.log(`  With description:  ${withDescription}`);
console.log(`  With globPatterns: ${withGlobs}`);
console.log(`  By category:`);
for (const [cat, n] of Object.entries(byCategory).sort()) {
  console.log(`    ${cat.padEnd(18)} ${n}`);
}
