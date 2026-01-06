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

let mermaidLib: typeof import("mermaid") | null = null;

async function renderMermaid(definition: string) {
  if (!mermaidLib) {
    const mermaid = await import("mermaid");
    mermaid.default.initialize({ startOnLoad: false, securityLevel: "strict" });
    mermaidLib = mermaid;
  }

  const { svg } = await mermaidLib.default.render(
    `mermaid-${Math.random().toString(36).slice(2, 9)}`,
    definition,
  );

  return svg;
}

function MermaidDiagram({ definition }: { definition: string }) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    renderMermaid(definition)
      .then((result) => {
        if (isMounted) {
          setSvg(result);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("Mermaid render failed", err);
        if (isMounted) {
          setError("Could not render diagram");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [definition]);

  if (error) {
    return (
      <pre className="mermaid-diagram">
        <code>{definition}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-diagram" aria-busy="true">
        <pre>
          <code>{definition}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

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
        components={{
          pre({ children, ...props }) {
            const child = Array.isArray(children) ? children[0] : children;
            const codeElement = React.isValidElement(child) ? child : null;
            const className =
              codeElement && typeof codeElement.props?.className === "string"
                ? codeElement.props.className
                : "";
            const isMermaid = className.includes("language-mermaid");

            if (isMermaid) {
              const codeContent = codeElement?.props?.children ?? "";
              const definition = Array.isArray(codeContent)
                ? codeContent.join("")
                : String(codeContent);

              return <MermaidDiagram definition={definition.trim()} />;
            }

            return <pre {...props}>{children}</pre>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
