import type { Metadata } from "next";
import Link from "next/link";
import { getAllAboutEntries, getAboutSummary, type AboutCategory } from "@/lib/about";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = {
  title: "About",
  description: "Timeline of experiences and milestones.",
};

const CATEGORY_ORDER: AboutCategory[] = ["experience", "education", "certificates"];
const CATEGORY_LABELS: Record<AboutCategory, string> = {
  experience: "Experience",
  education: "Education",
  certificates: "Certificates",
};

export default function AboutPage() {
  const entries = getAllAboutEntries();
  const summary = getAboutSummary();

  // Group entries by category, then by year within each category
  const categoryGroups = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const category = entry.category ?? "other";
    acc[category] = acc[category] || [];
    acc[category].push(entry);
    return acc;
  }, {});

  // Sort entries within each category by date (newest first)
  Object.values(categoryGroups).forEach((categoryEntries) => {
    categoryEntries.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  // Function to group entries by year
  const groupByYear = (categoryEntries: typeof entries) => {
    const groups = categoryEntries.reduce<Record<string, typeof entries>>((acc, entry) => {
      const year = entry.date
        ? new Date(entry.date).getFullYear().toString()
        : "Other";
      acc[year] = acc[year] || [];
      acc[year].push(entry);
      return acc;
    }, {});

    const orderedYears = Object.keys(groups).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (Number.isNaN(numA) && Number.isNaN(numB)) return 0;
      if (Number.isNaN(numA)) return 1;
      if (Number.isNaN(numB)) return -1;
      return numB - numA;
    });

    return { groups, orderedYears };
  };

  return (
    <section className="page-shell flex flex-col gap-10">
      <header>
        <h1 className="mb-6 mt-2">About</h1>
      </header>

      {summary && (
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-4">
          <Markdown content={summary} stripFirstHeading={false} />
        </div>
      )}

      <div className="flex flex-col gap-12">
        {CATEGORY_ORDER.map((category) => {
          const categoryEntries = categoryGroups[category];
          if (!categoryEntries || categoryEntries.length === 0) return null;

          const { groups, orderedYears } = groupByYear(categoryEntries);

          return (
            <div key={category} className="flex flex-col gap-6">
              <h2 className="text-2xl font-semibold text-[var(--ink)] border-b border-[var(--border)] pb-2">
                {CATEGORY_LABELS[category]}
              </h2>

              <div className="flex flex-col gap-10">
                {orderedYears.map((year) => (
                  <div key={year} className="grid grid-cols-[100px_1fr] gap-4">
                    <div className="text-2xl font-light text-[var(--muted)]">{year}</div>
                    <ul className="m-0 list-none p-0">
                      {groups[year].map((entry) => {
                        const formatted =
                          entry.date && !Number.isNaN(new Date(entry.date).getTime())
                            ? new Intl.DateTimeFormat("en", {
                                month: "short",
                                day: "numeric",
                              }).format(new Date(entry.date))
                            : "";
                        return (
                          <li
                            key={entry.slug}
                            className="border-b border-dashed border-[var(--border-dashed)]"
                          >
                            <div className="flex flex-col gap-2 py-4">
                              <div className="flex items-baseline justify-between gap-4">
                                <Link
                                  href={`/about/${entry.slug}`}
                                  className="flex-1 font-normal text-base text-[var(--ink)] hover:underline"
                                >
                                  {entry.title ?? entry.slug}
                                </Link>
                                <span className="flex-shrink-0 text-sm text-[var(--muted)]">
                                  {formatted}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-sm text-[var(--muted)] m-0">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
