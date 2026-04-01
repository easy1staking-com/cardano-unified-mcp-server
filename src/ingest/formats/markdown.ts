import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

const markdownHandler: FormatHandler = {
  extensions: [".md"],

  sniff(content: string): boolean {
    const first50 = content.slice(0, 2000);
    // Markdown: has # headers, or is plain text without RST/YAML markers
    if (/^#{1,6}\s+/m.test(first50)) return true;
    // Not RST (no underline headers) and not YAML (no openapi:)
    if (/^openapi:/m.test(first50)) return false;
    if (/^[=~^"-]{3,}$/m.test(first50)) return false;
    return true; // default: plain text is valid markdown
  },

  preprocess(content: string): string {
    return stripFrontmatter(content);
  },

  splitSections(content: string): Section[] {
    const lines = content.split("\n");
    const sections: Section[] = [];
    let currentTitle = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        if (currentContent.length > 0) {
          sections.push({
            title: currentTitle,
            content: currentContent.join("\n"),
          });
        }
        currentTitle = headerMatch[2].replace(/[*_`]/g, "").trim();
        currentContent = [line];
      } else {
        currentContent.push(line);
      }
    }

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

// MDX: extends markdown with JSX stripping
const mdxHandler: FormatHandler = {
  extensions: [".mdx", ".md"],

  sniff(content: string): boolean {
    // MDX files typically have imports or JSX components
    if (/^import\s+/m.test(content.slice(0, 1000))) return true;
    if (/<[A-Z][a-zA-Z]*/.test(content.slice(0, 2000))) return true;
    // Also valid as plain markdown
    return markdownHandler.sniff(content);
  },

  preprocess(content: string): string {
    content = stripFrontmatter(content);
    return stripMDX(content);
  },

  splitSections(content: string): Section[] {
    return markdownHandler.splitSections(content);
  },
};

function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      return content.slice(end + 3).trim();
    }
  }
  return content;
}

function stripMDX(content: string): string {
  // Remove import statements
  content = content.replace(/^import\s+.*$/gm, "");
  // Remove export statements (but keep default export content)
  content = content.replace(/^export\s+(default\s+)?/gm, "");
  // Remove JSX self-closing tags
  content = content.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, "");
  // Remove JSX opening/closing tags but keep children
  content = content.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, "");
  // Remove {expressions} but keep simple string content
  content = content.replace(/\{`([^`]*)`\}/g, "$1");
  return content;
}

// Register both
registerFormat("markdown", markdownHandler);
registerFormat("mdx", mdxHandler);
