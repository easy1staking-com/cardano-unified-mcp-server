import { extname } from "path";
import { minimatch } from "minimatch";
import type { DocFormat, DocSource } from "../../config/sources.js";

// ---------------------------------------------------------------------------
// FormatHandler — the interface every format must implement
// ---------------------------------------------------------------------------

export interface Section {
  title: string;
  content: string;
}

export interface FormatHandler {
  /** File extensions this format can handle (including the dot). */
  extensions: string[];

  /**
   * Lightweight content sniff. Returns true if the content looks like this
   * format. Used during validation — NOT a full parser.
   */
  sniff(content: string): boolean;

  /** Format-specific preprocessing (strip frontmatter, imports, etc.). */
  preprocess(content: string): string;

  /** Split content into semantic sections. */
  splitSections(content: string): Section[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<DocFormat, FormatHandler>();

export function registerFormat(format: DocFormat, handler: FormatHandler): void {
  registry.set(format, handler);
}

export function getFormatHandler(format: DocFormat): FormatHandler {
  const handler = registry.get(format);
  if (!handler) {
    throw new Error(
      `No handler registered for format "${format}". ` +
        `Registered formats: ${[...registry.keys()].join(", ")}`
    );
  }
  return handler;
}

export function getRegisteredFormats(): DocFormat[] {
  return [...registry.keys()];
}

// ---------------------------------------------------------------------------
// Format resolution: file path + source config → DocFormat
// ---------------------------------------------------------------------------

const EXTENSION_TO_FORMAT: Record<string, DocFormat> = {
  ".md": "markdown",
  ".mdx": "mdx",
  ".rst": "rst",
  ".yaml": "openapi",
  ".yml": "openapi",
  ".json": "openapi",
  ".ak": "aiken",
  ".toml": "toml",
  ".py": "python",
};

const FORMAT_EXTENSIONS: Record<DocFormat, string[]> = {
  markdown: [".md"],
  mdx: [".mdx", ".md"],
  rst: [".rst"],
  openapi: [".yaml", ".yml", ".json"],
  aiken: [".ak"],
  toml: [".toml"],
  python: [".py"],
};

/**
 * Resolve the effective format for a file given its source config.
 *
 * Priority: formatOverrides > source.format > extension inference
 */
export function resolveFormat(filePath: string, source: DocSource): DocFormat {
  // 1. Check formatOverrides
  if (source.formatOverrides) {
    for (const [glob, format] of Object.entries(source.formatOverrides)) {
      if (minimatch(filePath, glob)) {
        return format;
      }
    }
  }

  // 2. Check if file extension is compatible with declared format
  const ext = extname(filePath).toLowerCase();
  const allowedExts = FORMAT_EXTENSIONS[source.format];
  if (allowedExts && allowedExts.includes(ext)) {
    return source.format;
  }

  // 3. Infer from extension
  const inferred = EXTENSION_TO_FORMAT[ext];
  if (inferred) {
    return inferred;
  }

  // 4. Fall back to source format (validator will catch mismatches)
  return source.format;
}

/**
 * Check if a file extension is compatible with a format.
 */
export function isExtensionCompatible(
  ext: string,
  format: DocFormat
): boolean {
  const allowed = FORMAT_EXTENSIONS[format];
  return allowed ? allowed.includes(ext.toLowerCase()) : false;
}

export { FORMAT_EXTENSIONS, EXTENSION_TO_FORMAT };
