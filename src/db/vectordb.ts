import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
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

  constructor(dbPath: string = config.dbPath, readOnly?: boolean) {
    const isReadOnly = readOnly ?? config.dbReadOnly;
    if (!isReadOnly) {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath, { readonly: isReadOnly });
    sqliteVec.load(this.db);
    if (!isReadOnly) {
      this.init();
    }
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

      CREATE VIRTUAL TABLE IF NOT EXISTS doc_chunks_vec USING vec0(
        id text primary key,
        embedding float[${config.embeddingsDimensions}] distance_metric=cosine
      );
    `);
  }

  upsertChunk(chunk: DocChunk) {
    // Main table
    this.db
      .prepare(
        `INSERT OR REPLACE INTO doc_chunks (id, source, category, path, title, content, url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        chunk.id,
        chunk.source,
        chunk.category,
        chunk.path,
        chunk.title,
        chunk.content,
        chunk.url || null
      );

    // FTS index
    this.db
      .prepare(`DELETE FROM doc_chunks_fts WHERE id = ?`)
      .run(chunk.id);
    this.db
      .prepare(
        `INSERT INTO doc_chunks_fts (id, source, category, title, content)
       VALUES (?, ?, ?, ?, ?)`
      )
      .run(chunk.id, chunk.source, chunk.category, chunk.title, chunk.content);

    // Vector index
    if (chunk.embedding) {
      this.db
        .prepare(`DELETE FROM doc_chunks_vec WHERE id = ?`)
        .run(chunk.id);
      this.db
        .prepare(`INSERT INTO doc_chunks_vec (id, embedding) VALUES (?, ?)`)
        .run(chunk.id, new Float32Array(chunk.embedding));
    }
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
    const queryBuf = new Float32Array(queryEmbedding);

    // sqlite-vec returns distance (0 = identical, 2 = opposite for cosine)
    // Convert to similarity score: 1 - (distance / 2)
    // Over-fetch when filtering by category since k is applied before the JOIN
    const fetchK = category ? limit * 4 : limit;

    const rows = this.db
      .prepare(
        `SELECT
          v.id, d.source, d.category, d.path, d.title, d.content, d.url,
          (1.0 - v.distance / 2.0) as score
        FROM doc_chunks_vec v
        JOIN doc_chunks d ON d.id = v.id
        WHERE v.embedding MATCH ?
          AND k = ?
        ORDER BY v.distance`
      )
      .all(queryBuf, fetchK) as SearchResult[];

    if (category) {
      return rows.filter((r) => r.category === category).slice(0, limit);
    }
    return rows;
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
        this.db.prepare(`DELETE FROM doc_chunks_vec WHERE id = ?`).run(id);
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
