"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChatPanel } from "./chat-panel";

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar side="right" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-end border-b border-sidebar-border px-4 py-4">
        <button
          onClick={toggleSidebar}
          className="font-mono text-xs bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--ink)] transition-colors"
        >
          back
        </button>
      </SidebarHeader>
      <SidebarContent className="chat-scope !overflow-hidden">
        <ChatPanel />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
