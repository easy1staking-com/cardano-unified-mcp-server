import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

// Aiken top-level definition keywords
const DEFINITION_RE =
  /^(pub\s+)?(fn|type|const|validator|test)\s+(\w+)/;

const aikenHandler: FormatHandler = {
  extensions: [".ak"],

  sniff(content: string): boolean {
    const head = content.slice(0, 2000);
    // Aiken markers: use statements, fn/type/validator definitions, /// doc comments
    if (/^use\s+\w/m.test(head)) return true;
    if (/^(pub\s+)?(fn|type|const|validator|test)\s+/m.test(head)) return true;
    if (/^\/\/\/\s+/m.test(head)) return true;
    return false;
  },

  preprocess(content: string): string {
    // No preprocessing — keep source intact for code-as-documentation
    return content;
  },

  splitSections(content: string): Section[] {
    const lines = content.split("\n");
    const sections: Section[] = [];
    let docComment: string[] = [];
    let currentDef = "";
    let currentContent: string[] = [];
    let braceDepth = 0;
    let inDefinition = false;

    function flush() {
      if (currentDef && currentContent.length > 0) {
        const fullContent = docComment.length > 0
          ? [...docComment, "", ...currentContent].join("\n")
          : currentContent.join("\n");
        sections.push({
          title: currentDef,
          content: fullContent,
        });
      }
      docComment = [];
      currentDef = "";
      currentContent = [];
      braceDepth = 0;
      inDefinition = false;
    }

    for (const line of lines) {
      const trimmed = line.trim();

      // Collect doc comments (/// lines)
      if (trimmed.startsWith("///")) {
        if (!inDefinition) {
          docComment.push(trimmed.slice(3).trim());
        } else {
          currentContent.push(line);
        }
        continue;
      }

      // use statements — skip (they're imports, not definitions)
      if (trimmed.startsWith("use ") && !inDefinition) {
        docComment = []; // discard any doc comment before use
        continue;
      }

      // Check for definition start
      const defMatch = trimmed.match(DEFINITION_RE);
      if (defMatch && !inDefinition) {
        // Flush previous definition
        flush();

        const visibility = defMatch[1]?.trim() || "";
        const kind = defMatch[2];
        const name = defMatch[3];
        currentDef = visibility ? `${visibility} ${kind} ${name}` : `${kind} ${name}`;
        inDefinition = true;
        currentContent = [line];

        // Count braces on this line
        braceDepth += countChar(trimmed, "{") - countChar(trimmed, "}");
        continue;
      }

      if (inDefinition) {
        currentContent.push(line);
        braceDepth += countChar(trimmed, "{") - countChar(trimmed, "}");

        // Definition ends when braces balance (or single-line const with no braces)
        if (braceDepth <= 0 && currentContent.length > 0) {
          flush();
        }
      } else {
        // Preamble or between definitions — collect for context
        if (trimmed.length > 0 && !trimmed.startsWith("//")) {
          currentContent.push(line);
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

function countChar(s: string, c: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === c) count++;
  }
  return count;
}

registerFormat("aiken", aikenHandler);
