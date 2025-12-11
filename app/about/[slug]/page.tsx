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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const fromFormatted = entry.from ? formatDate(entry.from) : "";
  const toFormatted = entry.to ? formatDate(entry.to) : "Present";
  const dateRange = fromFormatted ? `${fromFormatted} – ${toFormatted}` : "";

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
          {dateRange}
          {entry.category && ` · ${entry.category}`}
        </p>
        <div className="flex items-start sm:items-center gap-3">
          {entry.icon && (
            <img
              src={entry.icon}
              alt=""
              className="w-10 h-10 rounded object-contain flex-shrink-0"
            />
          )}
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-[var(--ink)]">
            {entry.title}
          </h1>
        </div>
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
