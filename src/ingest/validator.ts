import { extname } from "path";
import type { DocFormat, DocSource } from "../config/sources.js";
import type { RawDoc } from "./chunker.js";
import {
  isExtensionCompatible,
  getFormatHandler,
  getRegisteredFormats,
  resolveFormat,
} from "./formats/index.js";

// Ensure all format handlers are registered
import "./formats/markdown.js";
import "./formats/rst.js";
import "./formats/openapi.js";
import "./formats/aiken.js";
import "./formats/toml.js";

export interface ValidationError {
  source: string;
  file: string;
  declaredFormat: DocFormat;
  resolvedFormat: DocFormat;
  detectedFormat: DocFormat | "unknown";
  message: string;
}

export interface ValidationWarning {
  source: string;
  file: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fileCounts: Map<string, Map<DocFormat, number>>; // source → format → count
}

/**
 * Validate all raw documents before chunking/embedding.
 * Collects ALL errors (not fail-on-first) so the user can fix everything at once.
 */
export function validateDocs(
  docsBySource: Map<string, { source: DocSource; docs: RawDoc[] }>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const fileCounts = new Map<string, Map<DocFormat, number>>();

  const registeredFormats = new Set(getRegisteredFormats());

  for (const [name, { source, docs }] of docsBySource) {
    const counts = new Map<DocFormat, number>();
    fileCounts.set(name, counts);

    for (const doc of docs) {
      const ext = extname(doc.path).toLowerCase();
      const resolved = resolveFormat(doc.path, source);

      // Count files per format
      counts.set(resolved, (counts.get(resolved) || 0) + 1);

      // Check 1: Is the resolved format registered?
      if (!registeredFormats.has(resolved)) {
        errors.push({
          source: name,
          file: doc.path,
          declaredFormat: source.format,
          resolvedFormat: resolved,
          detectedFormat: "unknown",
          message:
            `No handler registered for format "${resolved}". ` +
            `Registered formats: ${[...registeredFormats].join(", ")}`,
        });
        continue;
      }

      // Check 2: Extension vs resolved format compatibility
      if (!isExtensionCompatible(ext, resolved)) {
        // Try to detect what the file actually is
        const detected = detectFormat(doc.content);
        errors.push({
          source: name,
          file: doc.path,
          declaredFormat: source.format,
          resolvedFormat: resolved,
          detectedFormat: detected,
          message:
            `Extension "${ext}" is incompatible with format "${resolved}". ` +
            (detected !== "unknown"
              ? `Content looks like "${detected}". Fix formatOverrides or change source format.`
              : `Could not detect format from content. Check source config.`),
        });
        continue;
      }

      // Check 3: Content sniff — does the content match the resolved format?
      const handler = getFormatHandler(resolved);
      if (!handler.sniff(doc.content)) {
        const detected = detectFormat(doc.content);
        if (detected !== resolved && detected !== "unknown") {
          warnings.push({
            source: name,
            file: doc.path,
            message:
              `Content doesn't look like "${resolved}" (sniff failed). ` +
              `Looks more like "${detected}". May produce poor chunks.`,
          });
        }
      }

      // Warning: TOML files are low-value config
      if (resolved === "toml") {
        warnings.push({
          source: name,
          file: doc.path,
          message: "TOML config file — low documentation value, will be stored as raw text.",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileCounts,
  };
}

/**
 * Try to detect format from content using all registered handlers' sniff().
 */
function detectFormat(content: string): DocFormat | "unknown" {
  // Check in a specific order (most distinctive first)
  const checkOrder: DocFormat[] = ["openapi", "aiken", "rst", "toml", "mdx", "markdown"];

  for (const fmt of checkOrder) {
    try {
      const handler = getFormatHandler(fmt);
      if (handler.sniff(content)) {
        return fmt;
      }
    } catch {
      // Handler not registered, skip
    }
  }

  return "unknown";
}

/**
 * Print validation results to console.
 */
export function printValidationReport(result: ValidationResult): void {
  // Summary table
  console.log("\n  ┌─────────────────────────────────────────────────────────────────┐");
  console.log("  │                     Validation Summary                          │");
  console.log("  ├──────────────────────────┬──────────┬───────┬──────────────────┤");
  console.log("  │ Source                   │ Format   │ Files │ Warnings         │");
  console.log("  ├──────────────────────────┼──────────┼───────┼──────────────────┤");

  for (const [source, counts] of result.fileCounts) {
    for (const [format, count] of counts) {
      const warnCount = result.warnings.filter(
        (w) => w.source === source && w.file.endsWith(`.${format === "markdown" ? "md" : format}`)
      ).length;
      console.log(
        `  │ ${source.padEnd(24)} │ ${format.padEnd(8)} │ ${String(count).padStart(5)} │ ${String(warnCount).padStart(16)} │`
      );
    }
  }
  console.log("  └──────────────────────────┴──────────┴───────┴──────────────────┘");

  // Warnings
  if (result.warnings.length > 0) {
    console.warn(`\n  ${result.warnings.length} warning(s):`);
    for (const w of result.warnings) {
      console.warn(`  WARN [${w.source}] ${w.file}: ${w.message}`);
    }
  }

  // Errors
  if (result.errors.length > 0) {
    console.error(`\n  ╔══════════════════════════════════════════════════════════════╗`);
    console.error(`  ║              VALIDATION FAILED — ${String(result.errors.length).padStart(3)} error(s)                 ║`);
    console.error(`  ╚══════════════════════════════════════════════════════════════╝\n`);

    for (const e of result.errors) {
      console.error(`  ERROR [${e.source}] ${e.file}`);
      console.error(`    Declared: ${e.declaredFormat} → Resolved: ${e.resolvedFormat} → Detected: ${e.detectedFormat}`);
      console.error(`    ${e.message}\n`);
    }

    console.error("  Fix source definitions in src/config/sources.ts and retry.");
    console.error("  No embeddings were generated. No API costs incurred.\n");
  } else {
    console.log(`\n  ✓ All files validated successfully.\n`);
  }
}
