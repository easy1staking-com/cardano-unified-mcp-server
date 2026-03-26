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
  batchSize: number = 100
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

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

    if (i + batchSize < texts.length) {
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
