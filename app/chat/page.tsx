import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat-panel";

export const metadata: Metadata = {
  title: "Chat | SegmentX",
  description: "Chat with the SegmentX blog using RAG over the markdown posts.",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <ChatPanel />
    </div>
  );
}
