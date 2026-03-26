import { createHash } from "crypto";

export interface RawDoc {
  source: string;
  category: string;
  path: string;
  content: string;
  url?: string;
}

export interface Chunk {
  id: string;
  source: string;
  category: string;
  path: string;
  title: string;
  content: string;
  url?: string;
}

const MAX_CHUNK_SIZE = 1000; // tokens (rough: 1 token ≈ 4 chars)
const CHUNK_OVERLAP = 100;
const CHARS_PER_TOKEN = 4;

export function chunkDocuments(docs: RawDoc[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const doc of docs) {
    const sections = splitBySections(doc.content);

    for (const section of sections) {
      const title = section.title || extractTitle(doc.path);
      const textChunks = splitBySize(
        section.content,
        MAX_CHUNK_SIZE * CHARS_PER_TOKEN,
        CHUNK_OVERLAP * CHARS_PER_TOKEN
      );

      for (let i = 0; i < textChunks.length; i++) {
        const chunkContent = textChunks[i].trim();
        if (chunkContent.length < 50) continue; // skip tiny fragments

        const id = createHash("sha256")
          .update(`${doc.source}:${doc.path}:${i}:${section.title}`)
          .digest("hex")
          .slice(0, 16);

        chunks.push({
          id,
          source: doc.source,
          category: doc.category,
          path: doc.path,
          title: textChunks.length > 1 ? `${title} (${i + 1}/${textChunks.length})` : title,
          content: chunkContent,
          url: doc.url,
        });
      }
    }
  }

  return chunks;
}

interface Section {
  title: string;
  content: string;
}

function splitBySections(content: string): Section[] {
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

  // If no sections found, return the whole doc as one section
  if (sections.length === 0) {
    return [{ title: "", content }];
  }

  return sections;
}

function splitBySize(
  text: string,
  maxChars: number,
  overlapChars: number
): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastNewline = slice.lastIndexOf("\n");
      const lastSentence = slice.lastIndexOf(". ");

      if (lastParagraph > maxChars * 0.5) {
        end = start + lastParagraph;
      } else if (lastNewline > maxChars * 0.5) {
        end = start + lastNewline;
      } else if (lastSentence > maxChars * 0.5) {
        end = start + lastSentence + 2;
      }
    }

    chunks.push(text.slice(start, end));
    start = end - overlapChars;

    if (start >= text.length) break;
  }

  return chunks;
}

function extractTitle(path: string): string {
  const parts = path.split("/");
  const filename = parts[parts.length - 1]
    .replace(/\.(md|mdx|rst)$/, "")
    .replace(/README/i, parts.length > 1 ? parts[parts.length - 2] : "Overview")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return filename;
}
