"use client";

import { useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChatPanel, ChatPanelHandle } from "./chat-panel";

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar();
  const chatPanelRef = useRef<ChatPanelHandle>(null);

  return (
    <Sidebar side="right" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-sidebar-border px-4 py-4">
        <button
          onClick={() => chatPanelRef.current?.resetChat()}
          className="font-mono text-xs bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--ink)] transition-colors"
        >
          + new chat
        </button>
        <button
          onClick={toggleSidebar}
          className="font-mono text-xs bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--ink)] transition-colors"
        >
          back
        </button>
      </SidebarHeader>
      <SidebarContent className="chat-scope !overflow-hidden">
        <ChatPanel ref={chatPanelRef} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
