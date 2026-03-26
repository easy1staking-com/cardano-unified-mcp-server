import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "../config/env.js";

export interface DocChunk {
  id: string;
  source: string;
  category: string;
  path: string;
  title: string;
  content: string;
  embedding?: number[];
  url?: string;
}

export interface SearchResult {
  id: string;
  source: string;
  category: string;
  path: string;
  title: string;
  content: string;
  score: number;
  url?: string;
}

export class VectorDB {
  private db: Database.Database;

  constructor(dbPath: string = config.dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.pragma("journal_mode = WAL");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS doc_chunks (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        category TEXT NOT NULL,
        path TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        embedding BLOB,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_source ON doc_chunks(source);
      CREATE INDEX IF NOT EXISTS idx_category ON doc_chunks(category);

      CREATE VIRTUAL TABLE IF NOT EXISTS doc_chunks_fts USING fts5(
        id UNINDEXED,
        source UNINDEXED,
        category,
        title,
        content,
        tokenize='porter unicode61'
      );
    `);
  }

  upsertChunk(chunk: DocChunk) {
    const embeddingBlob = chunk.embedding
      ? Buffer.from(new Float32Array(chunk.embedding).buffer)
      : null;

    this.db
      .prepare(
        `INSERT OR REPLACE INTO doc_chunks (id, source, category, path, title, content, url, embedding)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        chunk.id,
        chunk.source,
        chunk.category,
        chunk.path,
        chunk.title,
        chunk.content,
        chunk.url || null,
        embeddingBlob
      );

    // Update FTS index
    this.db
      .prepare(`DELETE FROM doc_chunks_fts WHERE id = ?`)
      .run(chunk.id);
    this.db
      .prepare(
        `INSERT INTO doc_chunks_fts (id, source, category, title, content)
       VALUES (?, ?, ?, ?, ?)`
      )
      .run(chunk.id, chunk.source, chunk.category, chunk.title, chunk.content);
  }

  upsertChunks(chunks: DocChunk[]) {
    const tx = this.db.transaction(() => {
      for (const chunk of chunks) {
        this.upsertChunk(chunk);
      }
    });
    tx();
  }

  searchFTS(query: string, limit: number = 10, category?: string): SearchResult[] {
    const params: (string | number)[] = [query, limit];
    let categoryFilter = "";
    if (category) {
      categoryFilter = "AND f.category = ?";
      params.splice(1, 0, category);
    }

    const stmt = this.db.prepare(`
      SELECT
        f.id, d.source, d.category, d.path, d.title, d.content, d.url,
        rank * -1 as score
      FROM doc_chunks_fts f
      JOIN doc_chunks d ON d.id = f.id
      WHERE doc_chunks_fts MATCH ?
      ${categoryFilter}
      ORDER BY rank
      LIMIT ?
    `);

    return stmt.all(...params) as SearchResult[];
  }

  searchVector(
    queryEmbedding: number[],
    limit: number = 10,
    category?: string
  ): SearchResult[] {
    // Cosine similarity via manual computation
    // For production, consider sqlite-vss or pgvector
    const queryBuf = new Float32Array(queryEmbedding);

    let rows: Array<{
      id: string;
      source: string;
      category: string;
      path: string;
      title: string;
      content: string;
      url: string | null;
      embedding: Buffer;
    }>;

    if (category) {
      rows = this.db
        .prepare(
          `SELECT id, source, category, path, title, content, url, embedding
           FROM doc_chunks WHERE embedding IS NOT NULL AND category = ?`
        )
        .all(category) as typeof rows;
    } else {
      rows = this.db
        .prepare(
          `SELECT id, source, category, path, title, content, url, embedding
           FROM doc_chunks WHERE embedding IS NOT NULL`
        )
        .all() as typeof rows;
    }

    const scored = rows
      .map((row) => {
        const stored = new Float32Array(
          row.embedding.buffer,
          row.embedding.byteOffset,
          row.embedding.byteLength / 4
        );
        const score = cosineSimilarity(queryBuf, stored);
        return {
          id: row.id,
          source: row.source,
          category: row.category,
          path: row.path,
          title: row.title,
          content: row.content,
          url: row.url || undefined,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  getDoc(id: string): DocChunk | null {
    const row = this.db
      .prepare(
        `SELECT id, source, category, path, title, content, url FROM doc_chunks WHERE id = ?`
      )
      .get(id) as DocChunk | undefined;
    return row || null;
  }

  getDocByPath(source: string, path: string): DocChunk | null {
    const row = this.db
      .prepare(
        `SELECT id, source, category, path, title, content, url FROM doc_chunks WHERE source = ? AND path = ?`
      )
      .get(source, path) as DocChunk | undefined;
    return row || null;
  }

  listSources(): Array<{ source: string; category: string; count: number }> {
    return this.db
      .prepare(
        `SELECT source, category, COUNT(*) as count FROM doc_chunks GROUP BY source, category ORDER BY source`
      )
      .all() as Array<{ source: string; category: string; count: number }>;
  }

  listTopics(
    source?: string
  ): Array<{ source: string; path: string; title: string }> {
    if (source) {
      return this.db
        .prepare(
          `SELECT DISTINCT source, path, title FROM doc_chunks WHERE source = ? ORDER BY path`
        )
        .all(source) as Array<{ source: string; path: string; title: string }>;
    }
    return this.db
      .prepare(
        `SELECT DISTINCT source, path, title FROM doc_chunks ORDER BY source, path`
      )
      .all() as Array<{ source: string; path: string; title: string }>;
  }

  deleteSource(source: string) {
    this.db.transaction(() => {
      const ids = this.db
        .prepare(`SELECT id FROM doc_chunks WHERE source = ?`)
        .all(source) as Array<{ id: string }>;
      for (const { id } of ids) {
        this.db.prepare(`DELETE FROM doc_chunks_fts WHERE id = ?`).run(id);
      }
      this.db.prepare(`DELETE FROM doc_chunks WHERE source = ?`).run(source);
    })();
  }

  getStats(): { total_chunks: number; sources: number; categories: number } {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as total_chunks, COUNT(DISTINCT source) as sources, COUNT(DISTINCT category) as categories FROM doc_chunks`
      )
      .get() as { total_chunks: number; sources: number; categories: number };
    return row;
  }

  close() {
    this.db.close();
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
