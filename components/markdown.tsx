"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content: string;
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose max-w-none text-[var(--ink)] prose-a:text-[var(--accent)] prose-strong:text-[var(--ink)] prose-pre:rounded-xl prose-pre:bg-[#0a0c10] prose-pre:text-[#e8e9ed] prose-code:bg-[rgba(0,0,0,0.08)] prose-code:text-[var(--ink)] prose-code:px-2 prose-code:py-1 prose-code:rounded-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          rehypeHighlight,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
            },
          ],
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["noopener", "noreferrer"] },
          ],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
