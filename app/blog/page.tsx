import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Latent Field Notes",
  description:
    "AI engineering essays on evals, alignment, and operating long-running coding agents.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Blog
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Field notes on reliable AI systems
        </h1>
        <p className="max-w-3xl text-base text-slate-200">
          Markdown lives in `/blogs`, parsed at build time. Each post gets a
          giscus discussion thread mapped by pathname.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
