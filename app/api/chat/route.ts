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
        const fs = await import("fs");
        const path = await import("path");

        console.log("[DEBUG] Starting query with message:", userMessage);
        console.log("[DEBUG] Environment check:");
        console.log("  - NODE_ENV:", process.env.NODE_ENV);
        console.log("  - CWD:", process.cwd());
        console.log("  - ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);

        // Check if CLI exists
        const cliPath = path.join(process.cwd(), "node_modules", "@anthropic-ai", "claude-agent-sdk", "cli.js");
        const cliExists = fs.existsSync(cliPath);
        console.log("[DEBUG] CLI path:", cliPath);
        console.log("[DEBUG] CLI exists:", cliExists);
        if (cliExists) {
          const stats = fs.statSync(cliPath);
          console.log("[DEBUG] CLI size:", stats.size, "bytes");
          console.log("[DEBUG] CLI is executable:", !!(stats.mode & 0o111));
        }

        // Check /tmp directory
        const tmpWritable = fs.existsSync("/tmp");
        console.log("[DEBUG] /tmp exists:", tmpWritable);
        if (tmpWritable) {
          try {
            const testFile = "/tmp/.claude-test";
            fs.writeFileSync(testFile, "test");
            fs.unlinkSync(testFile);
            console.log("[DEBUG] /tmp is writable");
          } catch (e) {
            console.log("[DEBUG] /tmp write test failed:", e);
          }
        }

        // Set HOME to /tmp if not set (Claude CLI might need this)
        if (!process.env.HOME) {
          process.env.HOME = "/tmp";
          console.log("[DEBUG] Set HOME to /tmp");
        }

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
          console.log("[DEBUG] Received message type:", message.type);
          // Stream each message as newline-delimited JSON
          controller.enqueue(encoder.encode(JSON.stringify(message) + "\n"));
        }
      } catch (error) {
        console.error("[ERROR] Chat API error:", error);
        console.error("[ERROR] Stack:", error instanceof Error ? error.stack : "N/A");
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: String(error), stack: error instanceof Error ? error.stack : undefined }) + "\n"));
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
