import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { embed, streamText } from "ai";
import { loadVectorStore, topK } from "@/lib/vector-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages?: ChatMessage[] };
  const question = messages?.at(-1)?.content?.trim();

  if (!question) {
    return NextResponse.json({ error: "No question provided" }, { status: 400 });
  }

  const store = await loadVectorStore();

  const qEmbedding = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: question,
  });

  const matches = topK(store, qEmbedding.embedding ?? [], 4);

  const context = matches
    .map((m) => `From /blog/${m.slug}:\n${m.text}`)
    .join("\n\n");

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system:
      "You are a concise assistant for the SegmentX blog. Answer using only the provided blog context. If unsure, say you don't know.",
    prompt: `Context:\n${context}\n\nUser question: ${question}\n\nAnswer grounded in the context:`,
  });

  return result.toTextStreamResponse();
}
