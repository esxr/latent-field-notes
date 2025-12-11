"use client";

import { FormEvent, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ui/shadcn-io/ai/conversation";
import {
  Message,
  MessageContent,
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
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ui/shadcn-io/ai/reasoning";
import { Loader } from "@/components/ui/shadcn-io/ai/loader";
import { Actions, Action } from "@/components/ui/shadcn-io/ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconSend, IconCopy, IconCheck } from "@tabler/icons-react";
import { useChatContext } from "./chat-context";
import { DragDemo } from "./drag-demo";

export type ChatPanelHandle = {
  resetChat: () => void;
};

type ToolCall = {
  id: string;
  name: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: Record<string, unknown>;
  output?: string;
  errorText?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "reasoning";
  content: string;
  // For reasoning messages - groups intermediate thoughts + tools
  reasoning?: {
    thoughts: string[];
    tools: ToolCall[];
    isStreaming: boolean;
  };
};

// Lightweight chat panel that streams the /api/chat response with Claude Agent SDK
export const ChatPanel = forwardRef<ChatPanelHandle>(function ChatPanel(_, ref) {
  const { pageContext } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextItems, setContextItems] = useState<Array<{ slug: string; title: string; path: string }>>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastPageContextRef = useRef<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.slug && data.title && data.path) {
        setContextItems((prev) => {
          if (prev.some((item) => item.slug === data.slug)) return prev;
          return [...prev, { slug: data.slug, title: data.title, path: data.path }];
        });
      }
    } catch {}
  };

  const removeContextItem = (slug: string) => {
    setContextItems((prev) => prev.filter((item) => item.slug !== slug));
  };

  const handleNewChat = () => {
    setMessages([]);
    setContextItems([]);
    lastPageContextRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    resetChat: handleNewChat,
  }));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-set context when pageContext changes
  useEffect(() => {
    if (pageContext && pageContext.slug !== lastPageContextRef.current) {
      lastPageContextRef.current = pageContext.slug;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContextItems((prev) => {
        // Only update if this context isn't already present
        if (prev.some(c => c.slug === pageContext.slug)) return prev;
        return [{ slug: pageContext.slug, title: pageContext.title, path: `/blogs/${pageContext.slug}.md` }];
      });
    } else if (!pageContext && lastPageContextRef.current) {
      lastPageContextRef.current = null;
      setContextItems(() => []);
    }
  }, [pageContext]);

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
      body: JSON.stringify({
        messages: [...messages, userMsg],
        context: contextItems.map((c) => c.path),
      }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    // Track the current reasoning block
    const reasoningId = `reasoning-${Date.now()}`;
    const thoughts: string[] = [];
    const tools: Record<string, ToolCall> = {};
    let hasReasoning = false;

    // Stream chunks and parse NDJSON
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);

          if (message.type === "assistant" && message.message?.content) {
            for (const block of message.message.content) {
              if (block.type === "text" && block.text) {
                // Add intermediate thought
                thoughts.push(block.text);
                hasReasoning = true;

                setMessages((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex(m => m.id === reasoningId);
                  if (idx >= 0) {
                    next[idx] = {
                      ...next[idx],
                      reasoning: {
                        thoughts: [...thoughts],
                        tools: Object.values(tools),
                        isStreaming: true,
                      },
                    };
                    return next;
                  }
                  return [
                    ...next,
                    {
                      id: reasoningId,
                      role: "reasoning",
                      content: "",
                      reasoning: {
                        thoughts: [...thoughts],
                        tools: Object.values(tools),
                        isStreaming: true,
                      },
                    },
                  ];
                });
              } else if (block.type === "tool_use") {
                // Add tool call to reasoning
                tools[block.id] = {
                  id: block.id,
                  name: block.name,
                  state: "input-available",
                  input: block.input,
                };
                hasReasoning = true;

                setMessages((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex(m => m.id === reasoningId);
                  if (idx >= 0) {
                    next[idx] = {
                      ...next[idx],
                      reasoning: {
                        thoughts: [...thoughts],
                        tools: Object.values(tools),
                        isStreaming: true,
                      },
                    };
                    return next;
                  }
                  return [
                    ...next,
                    {
                      id: reasoningId,
                      role: "reasoning",
                      content: "",
                      reasoning: {
                        thoughts: [...thoughts],
                        tools: Object.values(tools),
                        isStreaming: true,
                      },
                    },
                  ];
                });
              }
            }
          } else if (message.type === "result") {
            // Final result - mark reasoning as done and add final response
            if (hasReasoning) {
              setMessages((prev) => {
                const next = [...prev];
                const idx = next.findIndex(m => m.id === reasoningId);
                if (idx >= 0 && next[idx].reasoning) {
                  next[idx] = {
                    ...next[idx],
                    reasoning: {
                      ...next[idx].reasoning!,
                      isStreaming: false,
                    },
                  };
                }
                return next;
              });
            }

            if (message.result) {
              setMessages((prev) => [
                ...prev,
                { id: `result-${Date.now()}`, role: "assistant", content: message.result },
              ]);
            }
          } else if (message.type === "tool_result") {
            // Update tool with result
            if (message.tool_use_id && tools[message.tool_use_id]) {
              const toolOutput = typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);
              const isError = message.is_error;

              tools[message.tool_use_id] = {
                ...tools[message.tool_use_id],
                state: isError ? "output-error" : "output-available",
                output: toolOutput,
                errorText: isError ? toolOutput : undefined,
              };

              setMessages((prev) => {
                const next = [...prev];
                const idx = next.findIndex(m => m.id === reasoningId);
                if (idx >= 0 && next[idx].reasoning) {
                  next[idx] = {
                    ...next[idx],
                    reasoning: {
                      ...next[idx].reasoning!,
                      tools: Object.values(tools),
                    },
                  };
                }
                return next;
              });
            }
          } else if (message.type === "error") {
            console.error("Chat error:", message.error);
            setMessages((prev) => [
              ...prev,
              { id: `error-${Date.now()}`, role: "assistant", content: `Error: ${message.error}` },
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
    <div className="flex flex-col h-full min-h-0 bg-[var(--panel)] overflow-hidden">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                Ask my virtual version anything here! I&apos;ll use my internal knowledge.
              </p>
              <p className="text-sm text-[var(--muted)]">
                You can <b>Drag-n-drop</b> elements from the site into the chat to provide focused context.
              </p>
              <DragDemo />
            </div>
          ) : (
            messages.map((m) => {
              // Render reasoning blocks (intermediate thoughts + tools)
              if (m.role === "reasoning" && m.reasoning) {
                return (
                  <Reasoning key={m.id} isStreaming={m.reasoning.isStreaming} defaultOpen>
                    <ReasoningTrigger />
                    <ReasoningContent>
                      {m.reasoning.thoughts.join("\n\n")}
                    </ReasoningContent>
                    {m.reasoning.tools.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.reasoning.tools.map((tool) => (
                          <Tool key={tool.id}>
                            <ToolHeader
                              type={`tool-${tool.name}` as `tool-${string}`}
                              state={tool.state}
                            />
                            <ToolContent>
                              {tool.input && <ToolInput input={tool.input} />}
                              {(tool.output || tool.errorText) && (
                                <ToolOutput output={tool.output} errorText={tool.errorText} />
                              )}
                            </ToolContent>
                          </Tool>
                        ))}
                      </div>
                    )}
                  </Reasoning>
                );
              }

              // Render user and assistant messages
              return (
                <Message key={m.id} from={m.role === "reasoning" ? "assistant" : m.role}>
                  <MessageContent>
                    {m.role === "user" ? (
                      <div className="text-sm">{m.content}</div>
                    ) : (
                      <>
                        <Response>{m.content}</Response>
                        {m.content && (
                          <Actions className="mt-2">
                            <Action
                              tooltip={copiedId === m.id ? "Copied!" : "Copy"}
                              onClick={() => handleCopy(m.content, m.id)}
                            >
                              {copiedId === m.id ? (
                                <IconCheck className="size-4" />
                              ) : (
                                <IconCopy className="size-4" />
                              )}
                            </Action>
                          </Actions>
                        )}
                      </>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 px-4 py-3">
              <Loader size={18} />
              <span className="text-sm text-[var(--muted)]">Thinking...</span>
            </div>
          )}
          <div ref={endRef} />
        </ConversationContent>
      </Conversation>

      <div className="p-3">
        <div
          className="bg-background border border-border rounded-2xl overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {contextItems.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 pt-3 overflow-hidden">
              {contextItems.slice(0, 3).map((item) => (
                <span
                  key={item.slug}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-full flex-shrink-0 max-w-[100px]"
                  title={item.title}
                >
                  <span className="truncate">{item.title}</span>
                  <button
                    onClick={() => removeContextItem(item.slug)}
                    className="text-gray-400 hover:text-red-500 font-bold flex-shrink-0"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
              {contextItems.length > 3 && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  +{contextItems.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="px-3 pt-3 pb-2">
            <form onSubmit={send}>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? "Working..." : "Ask anything"}
                disabled={loading}
                className="w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-sm min-h-10 max-h-[25vh]"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </form>
          </div>

          <div className="mb-2 px-2 flex items-center justify-end">
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="size-7 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => send(e as unknown as FormEvent)}
            >
              <IconSend className="size-3 fill-primary" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
