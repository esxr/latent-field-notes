import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat-panel";

export const metadata: Metadata = {
  title: "Chat | SegmentX",
  description: "Chat with the SegmentX blog using RAG over the markdown posts.",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          RAG Assistant
        </p>
        <h1 className="text-3xl font-extrabold text-[var(--ink)]">Ask the blog</h1>
        <p className="text-sm text-[var(--muted)]">
          Answers are grounded in the published markdown posts.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
