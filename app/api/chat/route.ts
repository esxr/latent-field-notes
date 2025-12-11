import { query } from "@anthropic-ai/claude-agent-sdk";
import { getMcpServers } from "@/lib/mcp";
import { buildSystemPrompt } from "@/lib/prompts/pranav-persona";

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

type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Compacts conversation history to manage context window.
 * - If <= 4 messages: returns formatted history as-is
 * - If > 4 messages: summarizes older messages (all but last 4), keeps recent 4 in full
 */
async function compactHistory(messages: Message[]): Promise<string> {
  if (messages.length === 0) {
    return "";
  }

  // If 4 or fewer messages, return formatted history without compaction
  if (messages.length <= 4) {
    return messages
      .map((msg) => {
        const speaker = msg.role === "user" ? "User" : "Pranav";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n\n");
  }

  // Split into older messages (to summarize) and recent messages (keep in full)
  const olderMessages = messages.slice(0, -4);
  const recentMessages = messages.slice(-4);

  // Format older messages for summarization
  const olderText = olderMessages
    .map((msg) => {
      const speaker = msg.role === "user" ? "User" : "Pranav";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n\n");

  // Summarize older messages using Claude Haiku
  try {
    const summaryResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-3-5-20241022",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Summarize this conversation in 2-3 sentences, capturing key topics and context:\n\n${olderText}`,
          },
        ],
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Failed to summarize: ${summaryResponse.statusText}`);
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.content?.[0]?.text || "Previous conversation context unavailable.";

    // Format compacted history: [Summary] + recent messages
    const recentText = recentMessages
      .map((msg) => {
        const speaker = msg.role === "user" ? "User" : "Pranav";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n\n");

    return `[Earlier conversation summary: ${summary}]\n\n${recentText}`;
  } catch (error) {
    console.error("Error compacting history:", error);
    // Fallback: just format all messages without summarization
    return messages
      .map((msg) => {
        const speaker = msg.role === "user" ? "User" : "Pranav";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n\n");
  }
}

export async function POST(req: Request) {
  const { messages, context } = await req.json();
  const userMessage = messages?.at(-1)?.content?.trim();

  if (!userMessage) {
    return new Response("No message provided", { status: 400 });
  }

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Set HOME to /tmp if not set (required for Claude Agent SDK in serverless environments)
        if (!process.env.HOME) {
          process.env.HOME = "/tmp";
        }

        // Build persona-based system prompt with optional context
        const systemPrompt = buildSystemPrompt(context);

        // Extract conversation history (all messages except the last one)
        const history: Message[] = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Compact history and combine with current message
        const compactedHistory = await compactHistory(history);
        const promptWithHistory = compactedHistory
          ? `${compactedHistory}\n\nUser: ${userMessage}`
          : userMessage;

        for await (const message of query({
          prompt: promptWithHistory,
          options: {
            model: "claude-sonnet-4-20250514",
            allowedTools: ["WebSearch", "WebFetch", "Read", "Glob", "Grep"],
            maxTurns: 10,
            systemPrompt,
            mcpServers: getMcpServers(),

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
