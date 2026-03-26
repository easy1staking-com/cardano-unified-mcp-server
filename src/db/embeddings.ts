import { config } from "../config/env.js";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${config.embeddingsApiBase}/embeddings`, {
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
    throw new Error(`Embeddings API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  return data.data[0].embedding;
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 20
): Promise<number[][]> {
  const results: number[][] = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    let retries = 0;
    const maxRetries = 5;

    while (true) {
      const response = await fetch(`${config.embeddingsApiBase}/embeddings`, {
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

      if (response.status === 429 && retries < maxRetries) {
        retries++;
        const backoff = Math.min(2 ** retries * 1000, 60000);
        console.log(`  Rate limited, retrying in ${backoff / 1000}s (attempt ${retries}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Embeddings API error ${response.status}: ${err}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      // Sort by index to maintain order
      const sorted = data.data.sort((a, b) => a.index - b.index);
      results.push(...sorted.map((d) => d.embedding));
      console.log(`  Batch ${batchNum}/${totalBatches} done (${results.length}/${texts.length} embeddings)`);
      break;
    }

    if (i + batchSize < texts.length) {
      // Delay between batches to respect rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}
