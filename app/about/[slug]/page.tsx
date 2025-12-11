import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { getAllAboutSlugs, getAboutEntryBySlug } from "@/lib/about";

type AboutEntryPageParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getAllAboutSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: AboutEntryPageParams;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const entry = getAboutEntryBySlug(slug);
    return {
      title: `${entry.title} | Pranav Dhoolia`,
      description: entry.description,
    };
  } catch {
    return {
      title: "Entry not found | Pranav Dhoolia",
      description: "The requested entry could not be found.",
    };
  }
}

export default async function AboutEntryPage({
  params,
}: {
  params: AboutEntryPageParams;
}) {
  const { slug } = await params;

  let entry;

  try {
    entry = getAboutEntryBySlug(slug);
  } catch {
    notFound();
  }

  if (!entry) {
    notFound();
  }

  const shortDate =
    entry.date && !Number.isNaN(new Date(entry.date).getTime())
      ? new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(new Date(entry.date))
      : "";

  const year = entry.date
    ? new Date(entry.date).getFullYear()
    : "";

  return (
    <article className="page-shell flex flex-col gap-8">
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
        <Link href="/about" className="inline-flex items-center gap-2 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          About
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
          {shortDate && year && `${shortDate}, ${year}`}
          {entry.category && ` · ${entry.category}`}
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-[var(--ink)] sm:text-[2.625rem]">
          {entry.title}
        </h1>
      </header>

      <Markdown content={entry.content} />

      {entry.tags && entry.tags.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--panel)] px-3 py-1 text-sm text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </section>
      )}
    </article>
  );
}
