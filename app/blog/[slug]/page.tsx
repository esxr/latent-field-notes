import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Comments } from "@/components/comments";
import { Markdown } from "@/components/markdown";
import { ShapeBlur } from "@/components/shape-blur";
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
    <article className="flex flex-col gap-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] underline underline-offset-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blog
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flat-card relative h-60 w-full overflow-hidden rounded-3xl bg-[var(--panel)]">
          <ShapeBlur
            className="pointer-events-none absolute inset-0 opacity-45"
            variation={1}
            shapeSize={0.9}
            roundness={0.6}
            borderSize={0.06}
            circleSize={0.55}
            circleEdge={1}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
            {formatDate(post.date)}
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-lg text-[var(--muted)]">{post.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {post.readMinutes ? <span>{post.readMinutes} min read</span> : null}
            {post.tags?.length ? (
              <span className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--accent-soft)] px-3 py-1">
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <Markdown content={post.content} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Comments</h2>
        <div className="relative overflow-hidden rounded-2xl bg-[var(--panel)] p-4">
          <ShapeBlur
            className="pointer-events-none absolute inset-0 opacity-35"
            variation={3}
            shapeSize={0.8}
            roundness={0.7}
            borderSize={0.05}
            circleSize={0.5}
            circleEdge={1}
          />
          <div className="relative">
          <Comments />
          </div>
        </div>
      </section>
    </article>
  );
}
