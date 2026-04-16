import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

// Matches top-level and one-indent-level class/function definitions
const DEFINITION_RE = /^(\s*)(class|def|async\s+def)\s+(\w+)/;

const pythonHandler: FormatHandler = {
  extensions: [".py"],

  sniff(content: string): boolean {
    const head = content.slice(0, 2000);
    if (/^(from|import)\s+/m.test(head)) return true;
    if (/^(class|def|async\s+def)\s+/m.test(head)) return true;
    if (/^#!.*python/m.test(head)) return true;
    return false;
  },

  preprocess(content: string): string {
    // Keep source intact — code is the documentation
    return content;
  },

  splitSections(content: string): Section[] {
    const lines = content.split("\n");
    const sections: Section[] = [];
    let docstring: string[] = [];
    let currentDef = "";
    let currentContent: string[] = [];
    let currentIndent = -1;
    let inDefinition = false;

    function flush() {
      if (currentDef && currentContent.length > 0) {
        const fullContent =
          docstring.length > 0
            ? [...docstring, "", ...currentContent].join("\n")
            : currentContent.join("\n");
        sections.push({
          title: currentDef,
          content: fullContent,
        });
      }
      docstring = [];
      currentDef = "";
      currentContent = [];
      currentIndent = -1;
      inDefinition = false;
    }

    for (const line of lines) {
      const defMatch = line.match(DEFINITION_RE);

      if (defMatch) {
        const indent = defMatch[1].length;

        // Only split on top-level (0) and class-level (4) definitions
        // to keep methods with their class context, but not split on
        // deeply nested helper functions
        if (indent <= 4) {
          // If we're starting a same-or-outer-level definition, flush previous
          if (inDefinition && indent <= currentIndent) {
            flush();
          } else if (!inDefinition) {
            flush();
          }

          const kind = defMatch[2].replace("async ", "async_");
          const name = defMatch[3];
          currentDef = `${kind} ${name}`;
          currentIndent = indent;
          inDefinition = true;
          currentContent = [line];
          continue;
        }
      }

      if (inDefinition) {
        const trimmed = line.trim();

        // Check if we've left the current definition (non-empty line at
        // same or lesser indent that isn't a decorator or comment)
        if (
          trimmed.length > 0 &&
          !trimmed.startsWith("#") &&
          !trimmed.startsWith("@")
        ) {
          const lineIndent = line.length - line.trimStart().length;
          if (lineIndent <= currentIndent && !defMatch) {
            // This line belongs to a new scope — flush and handle as preamble
            flush();
            continue;
          }
        }

        currentContent.push(line);
      } else {
        // Preamble: collect module docstrings and top-level comments
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
          docstring.push(line);
        }
      }
    }

    // Flush last definition
    flush();

    if (sections.length === 0) {
      return [{ title: "", content }];
    }

    return sections;
  },
};

registerFormat("python", pythonHandler);
