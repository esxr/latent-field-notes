import { query } from "@anthropic-ai/claude-agent-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Allowed directories for agent file access
const ALLOWED_PATHS = ["blogs", "storage"];

function isPathAllowed(path: string): boolean {
  const normalized = path.replace(/^\.?\//, ""); // Remove leading ./ or /
  return ALLOWED_PATHS.some(
    (allowed) =>
      normalized.startsWith(allowed + "/") ||
      normalized === allowed ||
      path.includes(`/${allowed}/`) ||
      path.includes(`/${allowed}`)
  );
}

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
            systemPrompt:
              "You can search the web and read local blog files in the ./blogs/ directory. You can also use the ./storage/ directory for any file operations.",

            canUseTool: async (
              toolName: string,
              input: Record<string, unknown>
            ) => {
              const fileTools = ["Read", "Glob", "Grep", "Edit", "Write"];
              if (fileTools.includes(toolName)) {
                const path =
                  (input.file_path as string) ||
                  (input.path as string) ||
                  (input.pattern as string) ||
                  "";

                if (!isPathAllowed(path)) {
                  return {
                    behavior: "deny" as const,
                    message:
                      "Access restricted to blogs/ and storage/ directories only",
                  };
                }
              }
              return { behavior: "allow" as const, updatedInput: input };
            },
          },
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
