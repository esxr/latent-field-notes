import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAllPosts } from "./blog";

type Chunk = {
  id: string;
  slug: string;
  text: string;
  embedding: number[];
};

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;

let cachedChunks: Chunk[] | null = null;

function chunkText(text: string, slug: string) {
  const words = text.split(/\s+/);
  const chunks: Omit<Chunk, "embedding">[] = [];

  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const slice = words.slice(i, i + CHUNK_SIZE).join(" ").trim();
    if (slice) {
      chunks.push({
        id: `${slug}-${i}`,
        slug,
        text: slice,
      });
    }
  }

  return chunks;
}

export async function loadVectorStore(): Promise<Chunk[]> {
  if (cachedChunks) return cachedChunks;

  const posts = getAllPosts();
  const chunks = posts.flatMap((post) => chunkText(post.content, post.slug));

  // Batch embed all chunks at once to reduce roundtrips.
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: chunks.map((c) => c.text),
  });

  cachedChunks = chunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx]?.embedding ?? [],
  }));

  return cachedChunks;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!denom) return 0;
  return dot / denom;
}

export function topK(store: Chunk[], query: number[], k = 4) {
  return store
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(chunk.embedding, query),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
