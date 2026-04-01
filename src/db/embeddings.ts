import { config } from "../config/env.js";

const LOG_LEVEL = process.env.EMBEDDINGS_LOG_LEVEL || "info"; // "debug" | "info" | "error"

// ---------------------------------------------------------------------------
// LRU cache for query embeddings — avoids redundant OpenAI calls
// ---------------------------------------------------------------------------

const CACHE_MAX = parseInt(process.env.EMBEDDINGS_CACHE_SIZE || "500", 10);

const cache = new Map<string, number[]>();

function cacheGet(key: string): number[] | undefined {
  const val = cache.get(key);
  if (val) {
    // Move to end (most recently used)
    cache.delete(key);
    cache.set(key, val);
  }
  return val;
}

function cacheSet(key: string, val: number[]) {
  if (cache.size >= CACHE_MAX) {
    // Evict oldest (first entry)
    const oldest = cache.keys().next().value!;
    cache.delete(oldest);
  }
  cache.set(key, val);
}

function log(level: "debug" | "info" | "error", msg: string) {
  const levels = { debug: 0, info: 1, error: 2 };
  if (levels[level] >= levels[LOG_LEVEL as keyof typeof levels]) {
    const fn = level === "error" ? console.error : console.log;
    fn(msg);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = cacheGet(text);
  if (cached) {
    log("debug", `  [embeddings] Cache hit`);
    return cached;
  }

  const url = `${config.embeddingsApiBase}/embeddings`;
  log("debug", `  [embeddings] POST ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.embeddingsApiKey}`,
    },
    body: JSON.stringify({
      model: config.embeddingsModel,
      input: text,
      dimensions: config.embeddingsDimensions,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    log("error", `  [embeddings] Error ${response.status}: ${err}`);
    throw new Error(`Embeddings API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  const embedding = data.data[0].embedding;
  cacheSet(text, embedding);
  return embedding;
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const results: number[][] = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  log("info", `  [embeddings] Generating ${texts.length} embeddings (${totalBatches} batches, model: ${config.embeddingsModel})`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    let retries = 0;
    const maxRetries = 5;

    while (true) {
      const url = `${config.embeddingsApiBase}/embeddings`;
      log("debug", `  [embeddings] Batch ${batchNum}/${totalBatches} (${batch.length} texts)`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.embeddingsApiKey}`,
        },
        body: JSON.stringify({
          model: config.embeddingsModel,
          input: batch,
          dimensions: config.embeddingsDimensions,
        }),
      });

      if (response.status === 429) {
        const errBody = await response.text();
        if (retries < maxRetries) {
          retries++;
          const backoff = Math.min(2 ** retries * 1000, 60000);
          log("info", `  [embeddings] Rate limited, retry ${retries}/${maxRetries} in ${backoff / 1000}s`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw new Error(`Embeddings API rate limited after ${maxRetries} retries: ${errBody}`);
      }

      if (!response.ok) {
        const err = await response.text();
        log("error", `  [embeddings] Error ${response.status}: ${err}`);
        throw new Error(`Embeddings API error ${response.status}: ${err}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      const sorted = data.data.sort((a, b) => a.index - b.index);
      results.push(...sorted.map((d) => d.embedding));
      log("info", `  [embeddings] Batch ${batchNum}/${totalBatches} done (${results.length}/${texts.length})`);
      break;
    }

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  log("info", `  [embeddings] Done: ${results.length} embeddings generated`);
  return results;
}
