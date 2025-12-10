"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatPanel } from "./chat-panel";

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="right" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-sidebar-border px-4 py-3">
        <h2 className="text-lg font-semibold invisible">Chat</h2>
        <SidebarTrigger className="rotate-180" />
      </SidebarHeader>
      <SidebarContent className="chat-scope !overflow-hidden">
        <ChatPanel />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
