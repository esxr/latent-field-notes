import { getAllPosts } from "@/lib/blog";

const siteName = "Pranav Dhoolia";

function trimTrailingSlash(url?: string | null) {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getRawRepoBase(repoUrl: string) {
  if (!repoUrl.startsWith("https://github.com/")) return "";
  return `${repoUrl.replace("https://github.com/", "https://raw.githubusercontent.com/")}/main`;
}

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const repoUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? "");
  const rawRepoBase = getRawRepoBase(repoUrl);

  const markdownLines: string[] = [
    `# ${siteName}`,
    "",
    "> Markdown-first blog on AI systems, evals, and alignment patterns. Posts live in /blogs/*.md and render via Next.js (App Router) with Tailwind UI.",
    "",
    "- Draft posts are skipped when `draft: true`; published posts include frontmatter for title/date/description/tags/hero.",
    "- The /chat page runs RAG over the published markdown, chunked and embedded at runtime; answers should stay grounded in those sources.",
    "- Prefer the raw markdown links below when summarizing or citing content.",
    "",
    "## Primary entry points",
    siteUrl ? `- [Home](${siteUrl})` : "- [Home](/)",
    `- [Posts index](${siteUrl || "/"}): HTML list of published posts.`,
    `- [Chat assistant](${siteUrl ? `${siteUrl}/chat` : "/chat"}): RAG answers grounded in the markdown posts.`,
  ];

  if (repoUrl) {
    markdownLines.push(
      `- [Source repository](${repoUrl}): Code + markdown content.`,
      `- [README](${repoUrl}/blob/main/README.md): Stack, content model, and local dev setup.`,
    );
  }

  markdownLines.push("", "## Markdown sources");

  for (const post of posts) {
    const linkBase =
      rawRepoBase ||
      (repoUrl ? `${repoUrl}/blob/main` : "");
    const href = linkBase
      ? `${linkBase}/blogs/${post.slug}.md`
      : `/blogs/${post.slug}.md`;
    const label = post.title ?? post.slug;
    const summary = (post.description ?? "").replace(/\s+/g, " ").trim();
    markdownLines.push(`- [${label}](${href}): ${summary || "Markdown source for this post."}`);
  }

  if (repoUrl) {
    markdownLines.push(
      "",
      "## Optional",
      `- [Chat endpoint source](${repoUrl}/blob/main/app/api/chat/route.ts): Shows how /chat builds context from the markdown posts.`,
      `- [Search endpoint source](${repoUrl}/blob/main/app/api/search/route.ts): Simple in-memory search over published posts.`,
    );
  }

  const body = markdownLines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
