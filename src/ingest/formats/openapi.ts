import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

const openapiHandler: FormatHandler = {
  extensions: [".yaml", ".yml", ".json"],

  sniff(content: string): boolean {
    const head = content.slice(0, 1000);
    // OpenAPI YAML
    if (/^openapi:/m.test(head)) return true;
    if (/^swagger:/m.test(head)) return true;
    // OpenAPI JSON
    if (/"openapi"\s*:/.test(head)) return true;
    if (/"swagger"\s*:/.test(head)) return true;
    // YAML with paths: key (could be OpenAPI)
    if (/^paths:/m.test(head)) return true;
    return false;
  },

  preprocess(content: string): string {
    // No preprocessing — the splitter handles extraction
    return content;
  },

  splitSections(content: string): Section[] {
    // Detect JSON vs YAML
    const trimmed = content.trimStart();
    if (trimmed.startsWith("{")) {
      return splitOpenApiJson(content);
    }
    return splitOpenApiYaml(content);
  },
};

// ---------------------------------------------------------------------------
// YAML OpenAPI splitter (line-by-line indentation tracking)
// ---------------------------------------------------------------------------

function splitOpenApiYaml(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];

  // Extract info.description
  const infoDesc = extractYamlBlock(lines, "info", "description");
  if (infoDesc) {
    sections.push({ title: "API Overview", content: cleanYamlString(infoDesc) });
  }

  // Extract paths
  const pathSections = extractPaths(lines);
  sections.push(...pathSections);

  // Extract component schemas
  const schemaSections = extractSchemas(lines);
  sections.push(...schemaSections);

  if (sections.length === 0) {
    // Fallback: return whole content as one section
    return [{ title: "", content }];
  }

  return sections;
}

function extractYamlBlock(lines: string[], parent: string, child: string): string | null {
  let inParent = false;
  let parentIndent = -1;
  let inChild = false;
  let childIndent = -1;
  const result: string[] = [];

  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (!inParent) {
      if (trimmed === `${parent}:` || trimmed.startsWith(`${parent}:`)) {
        inParent = true;
        parentIndent = indent;
      }
      continue;
    }

    // Still in parent?
    if (indent <= parentIndent && trimmed.length > 0) {
      break; // exited parent block
    }

    if (!inChild) {
      if (trimmed.startsWith(`${child}:`)) {
        inChild = true;
        childIndent = indent;
        // Inline value?
        const inlineValue = trimmed.slice(child.length + 1).trim();
        if (inlineValue && !inlineValue.startsWith("|") && !inlineValue.startsWith(">")) {
          return inlineValue;
        }
      }
      continue;
    }

    // In child block — collect until we exit
    if (indent <= childIndent && trimmed.length > 0) {
      break;
    }
    result.push(line);
  }

  return result.length > 0 ? result.join("\n") : null;
}

function extractPaths(lines: string[]): Section[] {
  const sections: Section[] = [];
  let inPaths = false;
  let pathsIndent = -1;
  let currentPath = "";
  let currentMethod = "";
  let pathIndent = -1;
  let methodIndent = -1;
  let collecting = false;
  let buffer: string[] = [];

  const HTTP_METHODS = new Set(["get", "post", "put", "delete", "patch", "head", "options"]);

  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (!inPaths) {
      if (/^paths:/.test(trimmed) && indent === 0) {
        inPaths = true;
        pathsIndent = indent;
      }
      continue;
    }

    // Exited paths block?
    if (indent <= pathsIndent && trimmed.length > 0 && !trimmed.startsWith("#")) {
      break;
    }

    // Path level (e.g., /matches:)
    if (indent === pathsIndent + 2 && trimmed.endsWith(":") && trimmed.startsWith("/")) {
      // Flush previous
      if (collecting && buffer.length > 0) {
        sections.push({
          title: `${currentMethod.toUpperCase()} ${currentPath}`,
          content: buffer.join("\n"),
        });
      }
      currentPath = trimmed.slice(0, -1);
      pathIndent = indent;
      collecting = false;
      buffer = [];
      continue;
    }

    // Method level (e.g., get:)
    if (currentPath && indent === pathIndent + 2) {
      const methodKey = trimmed.replace(":", "");
      if (HTTP_METHODS.has(methodKey)) {
        // Flush previous method
        if (collecting && buffer.length > 0) {
          sections.push({
            title: `${currentMethod.toUpperCase()} ${currentPath}`,
            content: buffer.join("\n"),
          });
        }
        currentMethod = methodKey;
        methodIndent = indent;
        collecting = true;
        buffer = [];
        continue;
      }
    }

    // Collect method content
    if (collecting) {
      // Still inside this method?
      if (indent > methodIndent || trimmed.length === 0) {
        buffer.push(line);
      } else {
        // Exited method — flush
        sections.push({
          title: `${currentMethod.toUpperCase()} ${currentPath}`,
          content: buffer.join("\n"),
        });
        collecting = false;
        buffer = [];
        // Re-check if this is a new method
        const methodKey = trimmed.replace(":", "");
        if (HTTP_METHODS.has(methodKey)) {
          currentMethod = methodKey;
          methodIndent = indent;
          collecting = true;
          buffer = [];
        }
      }
    }
  }

  // Flush last
  if (collecting && buffer.length > 0) {
    sections.push({
      title: `${currentMethod.toUpperCase()} ${currentPath}`,
      content: buffer.join("\n"),
    });
  }

  // Clean up section content: extract summary + description
  return sections.map((s) => ({
    title: s.title,
    content: extractEndpointContent(s.content),
  }));
}

function extractEndpointContent(raw: string): string {
  const lines = raw.split("\n");
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("summary:")) {
      parts.unshift(cleanYamlString(trimmed.slice(8)));
    } else if (trimmed.startsWith("description:")) {
      const inline = trimmed.slice(12).trim();
      if (inline && !inline.startsWith("|") && !inline.startsWith(">")) {
        parts.push(cleanYamlString(inline));
      }
    }
  }

  // Also grab multiline descriptions
  let inDesc = false;
  let descIndent = -1;
  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (trimmed.startsWith("description:") && (trimmed.endsWith("|") || trimmed.endsWith(">"))) {
      inDesc = true;
      descIndent = indent;
      continue;
    }

    if (inDesc) {
      if (indent <= descIndent && trimmed.length > 0) {
        inDesc = false;
      } else {
        parts.push(line);
      }
    }
  }

  return parts.length > 0 ? parts.join("\n").trim() : raw.trim();
}

function extractSchemas(lines: string[]): Section[] {
  const sections: Section[] = [];
  let inComponents = false;
  let inSchemas = false;
  let componentsIndent = -1;
  let schemasIndent = -1;
  let currentSchema = "";
  let schemaIndent = -1;
  let buffer: string[] = [];

  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (!inComponents) {
      if (/^components:/.test(trimmed) && indent === 0) {
        inComponents = true;
        componentsIndent = indent;
      }
      continue;
    }

    if (!inSchemas) {
      if (trimmed === "schemas:" && indent === componentsIndent + 2) {
        inSchemas = true;
        schemasIndent = indent;
      }
      continue;
    }

    // Exited schemas?
    if (indent <= schemasIndent && trimmed.length > 0) break;

    // Schema name level
    if (indent === schemasIndent + 2 && trimmed.endsWith(":")) {
      if (currentSchema && buffer.length > 0) {
        sections.push({
          title: `Schema: ${currentSchema}`,
          content: buffer.join("\n").trim(),
        });
      }
      currentSchema = trimmed.slice(0, -1);
      schemaIndent = indent;
      buffer = [];
      continue;
    }

    if (currentSchema) {
      buffer.push(line);
    }
  }

  // Flush last
  if (currentSchema && buffer.length > 0) {
    sections.push({
      title: `Schema: ${currentSchema}`,
      content: buffer.join("\n").trim(),
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// JSON OpenAPI splitter (simple)
// ---------------------------------------------------------------------------

function splitOpenApiJson(content: string): Section[] {
  try {
    const spec = JSON.parse(content);
    const sections: Section[] = [];

    if (spec.info?.description) {
      sections.push({ title: "API Overview", content: spec.info.description });
    }

    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(
          methods as Record<string, { summary?: string; description?: string }>
        )) {
          if (["get", "post", "put", "delete", "patch"].includes(method)) {
            const parts: string[] = [];
            if (details.summary) parts.push(details.summary);
            if (details.description) parts.push(details.description);
            if (parts.length > 0) {
              sections.push({
                title: `${method.toUpperCase()} ${path}`,
                content: parts.join("\n\n"),
              });
            }
          }
        }
      }
    }

    return sections.length > 0 ? sections : [{ title: "", content }];
  } catch {
    return [{ title: "", content }];
  }
}

function cleanYamlString(s: string): string {
  return s.replace(/^['"]|['"]$/g, "").trim();
}

registerFormat("openapi", openapiHandler);
