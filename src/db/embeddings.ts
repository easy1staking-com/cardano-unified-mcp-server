import { config } from "../config/env.js";

function fuzzKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 5)}...${key.slice(-4)}`;
}

function logEmbeddingsConfig() {
  const url = `${config.embeddingsApiBase}/embeddings`;
  console.log(`  [embeddings] URL: ${url}`);
  console.log(`  [embeddings] Model: ${config.embeddingsModel}`);
  console.log(`  [embeddings] Dimensions: ${config.embeddingsDimensions}`);
  console.log(`  [embeddings] API Key: ${fuzzKey(config.embeddingsApiKey)}`);
  console.log(`  [embeddings] API Base: ${config.embeddingsApiBase}`);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const url = `${config.embeddingsApiBase}/embeddings`;
  console.log(`  [embeddings] Single request → ${url}`);
  console.log(`  [embeddings] Key: ${fuzzKey(config.embeddingsApiKey)}`);

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

  console.log(`  [embeddings] Response: ${response.status} ${response.statusText}`);
  console.log(`  [embeddings] Response headers: content-type=${response.headers.get("content-type")}, x-request-id=${response.headers.get("x-request-id")}`);

  if (!response.ok) {
    const err = await response.text();
    console.error(`  [embeddings] Error body: ${err}`);
    throw new Error(`Embeddings API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  console.log(`  [embeddings] Success — got ${data.data[0].embedding.length}-dim embedding`);
  return data.data[0].embedding;
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const results: number[][] = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  console.log(`\n  [embeddings] === Batch embedding config ===`);
  logEmbeddingsConfig();
  console.log(`  [embeddings] Total texts: ${texts.length}, batch size: ${batchSize}, batches: ${totalBatches}`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    let retries = 0;
    const maxRetries = 5;

    while (true) {
      const url = `${config.embeddingsApiBase}/embeddings`;
      console.log(`\n  [embeddings] Batch ${batchNum}/${totalBatches} — POST ${url} (${batch.length} texts)`);

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

      console.log(`  [embeddings] Response: ${response.status} ${response.statusText}`);
      console.log(`  [embeddings] Headers: content-type=${response.headers.get("content-type")}, x-request-id=${response.headers.get("x-request-id")}, x-ratelimit-remaining-requests=${response.headers.get("x-ratelimit-remaining-requests")}, x-ratelimit-remaining-tokens=${response.headers.get("x-ratelimit-remaining-tokens")}, x-ratelimit-reset-requests=${response.headers.get("x-ratelimit-reset-requests")}`);

      if (response.status === 429) {
        const errBody = await response.text();
        console.warn(`  [embeddings] 429 body: ${errBody}`);

        if (retries < maxRetries) {
          retries++;
          const backoff = Math.min(2 ** retries * 1000, 60000);
          console.log(`  [embeddings] Rate limited, retrying in ${backoff / 1000}s (attempt ${retries}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw new Error(`Embeddings API rate limited after ${maxRetries} retries: ${errBody}`);
      }

      if (!response.ok) {
        const err = await response.text();
        console.error(`  [embeddings] Error body: ${err}`);
        throw new Error(`Embeddings API error ${response.status}: ${err}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      // Sort by index to maintain order
      const sorted = data.data.sort((a, b) => a.index - b.index);
      results.push(...sorted.map((d) => d.embedding));
      console.log(`  [embeddings] Batch ${batchNum}/${totalBatches} done (${results.length}/${texts.length} embeddings)`);
      break;
    }

    if (i + batchSize < texts.length) {
      // Delay between batches to respect rate limits
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n  [embeddings] === All done: ${results.length} embeddings generated ===`);
  return results;
}
