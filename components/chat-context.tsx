"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type PageContext = { slug: string; title: string } | null;

const ChatContextCtx = createContext<{
  pageContext: PageContext;
  setPageContext: (ctx: PageContext) => void;
}>({ pageContext: null, setPageContext: () => {} });

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<PageContext>(null);
  return (
    <ChatContextCtx.Provider value={{ pageContext, setPageContext }}>
      {children}
    </ChatContextCtx.Provider>
  );
}

export const useChatContext = () => useContext(ChatContextCtx);
