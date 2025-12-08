"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

// Lightweight chat panel that streams the /api/chat response.
export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
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

    const userMsg: Message = { role: "user", content: question };
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

    // Stream chunks into assistant message.
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          last.content = assistantText;
          return [...next];
        }
        return [...next, { role: "assistant", content: assistantText }];
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Ask anything about the blog posts. Responses stay grounded in the content.
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "bg-[var(--bg)] text-[var(--ink)] border border-[var(--border)]"
              }`}
            >
              <span className="font-semibold mr-2">{m.role === "user" ? "You" : "Assistant"}:</span>
              {m.content}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? "Working..." : "Ask about the blog content"}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-[var(--bg)] disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
