import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/blog";

const repoUrl =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? "https://github.com/";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts.slice(0, 3);

  return (
    <div className="flex flex-col gap-10">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/80 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-12">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            AI Systems · Evaluations · Alignment
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Markdown-first field notes on building reliable AI products.
          </h1>
          <p className="max-w-2xl text-lg text-slate-200">
            A GitHub-powered blog for pragmatic takes on RAG evals, alignment
            recipes, and long-horizon coding workflows. Content lives in
            `/blogs`, rendered by Next.js + Tailwind + shadcn primitives, with
            giscus discussions per post.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Read the blog
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href={repoUrl}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:bg-white/10"
              target="_blank"
              rel="noreferrer"
            >
              Open the repo
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-200">
            Latest thinking
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-sky-200 transition hover:text-sky-100"
          >
            View all posts →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((post) => (
            <PostCard key={post.slug} post={post} compact />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "GitHub as CMS",
            body: "Markdown in `/blogs` with frontmatter; edits land via PRs, parsed at build time.",
          },
          {
            title: "shadcn + Tailwind",
            body: "Composable primitives, glassmorphic cards, and typography tuned for long-form.",
          },
          {
            title: "Giscus comments",
            body: "Each URL maps to a GitHub Discussion so readers can react and leave notes.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="glow-border relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              {item.title}
            </div>
            <p className="mt-3 text-sm text-slate-200/85">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
