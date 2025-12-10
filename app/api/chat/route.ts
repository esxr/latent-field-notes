import { query } from "@anthropic-ai/claude-agent-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userMessage = messages?.at(-1)?.content?.trim();

  if (!userMessage) {
    return new Response("No message provided", { status: 400 });
  }

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const message of query({
          prompt: userMessage,
          options: {
            model: "claude-sonnet-4-20250514",
            allowedTools: ["WebSearch", "WebFetch", "Read", "Glob", "Grep"],
            maxTurns: 10,
            systemPrompt: "You are a helpful assistant for the Latent Field Notes blog about AI systems, evals, and alignment. Help users explore topics and answer questions. You can search the web and read local blog files in /Users/pranav/Desktop/blog/blogs/ directory.",
          }
        })) {
          // Stream each message as newline-delimited JSON
          controller.enqueue(encoder.encode(JSON.stringify(message) + "\n"));
        }
      } catch (error) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: String(error) }) + "\n"));
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    }
  });
}
