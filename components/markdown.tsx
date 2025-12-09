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
  stripFirstHeading?: boolean;
};

function removeFirstH1(markdown: string): string {
  // Remove the first # heading line (title already shown from frontmatter)
  // Handle leading whitespace/newlines before the heading
  return markdown.replace(/^\s*#\s+.+\n*/, "");
}

export function Markdown({ content, stripFirstHeading = true }: MarkdownProps) {
  const processedContent = stripFirstHeading ? removeFirstH1(content) : content;

  return (
    <div className="article-body max-w-none text-[var(--ink)]">
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
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
