import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Comments } from "@/components/comments";
import { Markdown } from "@/components/markdown";
import { formatDate, getAllPostSlugs, getPostBySlug } from "@/lib/blog";

type BlogPageParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: BlogPageParams;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = getPostBySlug(slug);
    return {
      title: `${post.title} | Latent Field Notes`,
      description: post.description,
    };
  } catch {
    return {
      title: "Post not found | Latent Field Notes",
      description: "The requested post could not be found.",
    };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: BlogPageParams;
}) {
  const { slug } = await params;

  let post;

  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:border-white/30 hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blog
      </Link>

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {formatDate(post.date)}
        </p>
        <h1 className="text-4xl font-semibold text-white">{post.title}</h1>
        {post.description && (
          <p className="text-lg text-slate-200/90">{post.description}</p>
        )}
      </header>

      <Markdown content={post.content} />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Comments</h2>
        <Comments />
      </section>
    </article>
  );
}
