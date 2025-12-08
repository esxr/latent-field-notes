"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content: string;
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose max-w-none text-[var(--ink)] prose-a:text-[var(--ink)] prose-pre:rounded-xl prose-pre:border prose-pre:border-[var(--border)] prose-pre:bg-[#f1ede5] prose-code:text-[#2d2a24]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
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
