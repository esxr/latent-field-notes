import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Comments } from "@/components/comments";
import { Markdown } from "@/components/markdown";
import { formatDate, getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { RegisterChatContext } from "@/components/register-chat-context";

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
      title: `${post.title} | Pranav Dhoolia`,
      description: post.description,
    };
  } catch {
    return {
      title: "Post not found | Pranav Dhoolia",
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

  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const shortDate =
    post.date && !Number.isNaN(new Date(post.date).getTime())
      ? new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(new Date(post.date))
      : "";

  return (
    <article className="page-shell flex flex-col gap-8">
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
        <Link href="/" className="inline-flex items-center gap-2 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Posts
        </Link>
        {post.readMinutes ? <span>{post.readMinutes} minutes</span> : null}
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
          {shortDate}
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-[var(--ink)] sm:text-[2.625rem]">
          {post.title}
        </h1>
      </header>

      <Markdown content={post.content} />

      <hr className="border-0 border-t border-[var(--border)]" />

      <section className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        <p>{wordCount} words</p>
        <p>{formatDate(post.date)}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Comments</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <Comments />
        </div>
      </section>

      <RegisterChatContext slug={slug} title={post.title ?? slug} />
    </article>
  );
}
