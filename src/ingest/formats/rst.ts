import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

// RST underline characters (in order of conventional heading hierarchy)
const RST_UNDERLINE_CHARS = ["=", "-", "~", "^", '"', "+", "#", "*"];
const RST_UNDERLINE_RE = new RegExp(
  `^([${RST_UNDERLINE_CHARS.map((c) => "\\" + c).join("")}])\\1{2,}$`
);

const rstHandler: FormatHandler = {
  extensions: [".rst"],

  sniff(content: string): boolean {
    const lines = content.split("\n", 50);
    // RST: look for underline-style headers (line of ===, ---, ~~~, etc.)
    for (let i = 1; i < lines.length; i++) {
      if (RST_UNDERLINE_RE.test(lines[i].trim())) {
        const titleLine = lines[i - 1].trim();
        if (titleLine.length > 0 && titleLine.length <= lines[i].trim().length + 2) {
          return true;
        }
      }
    }
    // RST directives
    if (/^\.\.\s+\w+::/.test(content.slice(0, 2000))) return true;
    return false;
  },

  preprocess(content: string): string {
    // Strip RST comments at the top (lines starting with .. not followed by a directive keyword)
    const lines = content.split("\n");
    let startIdx = 0;

    // Skip leading comments (.. without ::)
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "" || (trimmed.startsWith("..") && !trimmed.includes("::"))) {
        startIdx = i + 1;
      } else {
        break;
      }
    }

    return lines.slice(startIdx).join("\n");
  },

  splitSections(content: string): Section[] {
    const lines = content.split("\n");
    const sections: Section[] = [];
    let currentTitle = "";
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this line is an underline for the previous line
      if (i > 0 && RST_UNDERLINE_RE.test(trimmed)) {
        const titleLine = lines[i - 1].trim();
        // Valid RST header: underline length >= title length
        if (titleLine.length > 0 && trimmed.length >= titleLine.length) {
          // Save previous section (excluding the title line we already collected)
          if (currentContent.length > 1) {
            // Remove the title line from currentContent (it was added as a normal line)
            const titleContent = currentContent.slice(0, -1);
            if (titleContent.length > 0) {
              sections.push({
                title: currentTitle,
                content: titleContent.join("\n"),
              });
            }
          } else if (currentContent.length > 0 && currentTitle) {
            sections.push({
              title: currentTitle,
              content: currentContent.join("\n"),
            });
          }

          currentTitle = titleLine;
          currentContent = [];
          continue; // skip the underline itself
        }
      }

      currentContent.push(line);
    }

    // Push final section
    if (currentContent.length > 0) {
      sections.push({
        title: currentTitle,
        content: currentContent.join("\n"),
      });
    }

    if (sections.length === 0) {
      return [{ title: "", content }];
    }

    return sections;
  },
};

registerFormat("rst", rstHandler);
