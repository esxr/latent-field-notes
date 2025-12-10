"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ui/shadcn-io/ai/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ui/shadcn-io/ai/message";
import { Response } from "@/components/ui/shadcn-io/ai/response";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ui/shadcn-io/ai/tool";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ui/shadcn-io/ai/prompt-input";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolCall[];
};

type ToolCall = {
  id: string;
  type: `tool-${string}`;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: any;
  output?: string;
  errorText?: string;
};

// Lightweight chat panel that streams the /api/chat response with Claude Agent SDK
export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    let currentTools: Record<string, ToolCall> = {};
    let assistantId = Date.now().toString();

    // Stream chunks and parse NDJSON
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);

          // Handle different message types from Claude Agent SDK
          if (message.type === "assistant" && message.message?.content) {
            // Process content array which can contain text and tool_use blocks
            for (const block of message.message.content) {
              if (block.type === "text") {
                assistantText += block.text;
              } else if (block.type === "tool_use") {
                // Track tool call
                currentTools[block.id] = {
                  id: block.id,
                  type: `tool-${block.name}`,
                  state: "input-available",
                  input: block.input,
                };
              }
            }

            // Update assistant message with accumulated text and tools
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant" && last.id === assistantId) {
                last.content = assistantText;
                last.tools = Object.values(currentTools);
                return [...next];
              }
              return [
                ...next,
                {
                  id: assistantId,
                  role: "assistant",
                  content: assistantText,
                  tools: Object.values(currentTools),
                },
              ];
            });
          } else if (message.type === "result") {
            // Final result - contains full response
            if (message.result) {
              assistantText = message.result;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  last.content = assistantText;
                  return [...next];
                }
                return [
                  ...next,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: assistantText,
                    tools: Object.values(currentTools),
                  },
                ];
              });
            }
          } else if (message.type === "tool_result") {
            // Update tool with result
            if (message.tool_use_id && currentTools[message.tool_use_id]) {
              const toolOutput = typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

              currentTools[message.tool_use_id].state = message.is_error
                ? "output-error"
                : "output-available";
              currentTools[message.tool_use_id].output = toolOutput;
              if (message.is_error) {
                currentTools[message.tool_use_id].errorText = toolOutput;
              }

              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  last.tools = Object.values(currentTools);
                  return [...next];
                }
                return [...next];
              });
            }
          } else if (message.type === "error") {
            // Handle errors
            console.error("Chat error:", message.error);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: `Error: ${message.error}`,
              },
            ]);
          }
        } catch (err) {
          console.error("Failed to parse message:", line, err);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--panel)] overflow-hidden">
      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent>
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Ask anything about the blog posts or general topics. I can search the web and read blog files.
            </p>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageAvatar
                  src=""
                  name={m.role === "user" ? "You" : "AI"}
                  className={m.role === "assistant" ? "bg-primary text-primary-foreground" : undefined}
                />
                <MessageContent>
                  {m.role === "user" ? (
                    <div className="text-sm">{m.content}</div>
                  ) : (
                    <>
                      {m.tools && m.tools.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {m.tools.map((tool) => (
                            <Tool key={tool.id}>
                              <ToolHeader type={tool.type} state={tool.state} />
                              <ToolContent>
                                {tool.input && (
                                  <ToolInput input={tool.input} />
                                )}
                                {(tool.output || tool.errorText) && (
                                  <ToolOutput
                                    output={tool.output}
                                    errorText={tool.errorText}
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          ))}
                        </div>
                      )}
                      <Response>{m.content}</Response>
                    </>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          <div ref={endRef} />
        </ConversationContent>
      </Conversation>

      <div className="border-t border-[var(--border)] p-4">
        <PromptInput onSubmit={send}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "Working..." : "Ask about the blog content or anything else"}
            disabled={loading}
          />
          <PromptInputToolbar>
            <div className="flex-1" />
            <PromptInputSubmit
              disabled={loading || !input.trim()}
              status={loading ? "streaming" : "ready"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
