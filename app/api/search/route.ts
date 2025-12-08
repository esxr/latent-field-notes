import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const posts = getAllPosts();

  if (!q) {
    return NextResponse.json({
      results: posts.slice(0, 6).map((post) => ({
        title: post.title ?? post.slug,
        slug: post.slug,
        description: post.description,
      })),
    });
  }

  const term = q.toLowerCase();
  const results = posts
    .map((post) => {
      const haystack = `${post.title} ${post.description ?? ""} ${
        post.content
      }`.toLowerCase();
      const freq = haystack.split(term).length - 1;
      const score = freq + (haystack.includes(term) ? 1 : 0);
      return {
        title: post.title ?? post.slug,
        slug: post.slug,
        description: post.description,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score: _score, ...rest }) => rest);

  return NextResponse.json({ results });
}
