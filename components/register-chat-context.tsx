"use client";
import { useEffect } from "react";
import { useChatContext } from "./chat-context";

export function RegisterChatContext({ slug, title }: { slug: string; title: string }) {
  const { setPageContext } = useChatContext();

  useEffect(() => {
    setPageContext({ slug, title });
    return () => setPageContext(null); // Clear on unmount
  }, [slug, title, setPageContext]);

  return null;
}
