import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

  // Sort entries within each category by from date (newest first)
  Object.values(categoryGroups).forEach((categoryEntries) => {
    categoryEntries.sort((a, b) => {
      if (!a.from || !b.from) return 0;
      return new Date(b.from).getTime() - new Date(a.from).getTime();
    });
  });

  // Function to group entries by year (based on from date)
  const groupByYear = (categoryEntries: typeof entries) => {
    const groups = categoryEntries.reduce<Record<string, typeof entries>>((acc, entry) => {
      const year = entry.from
        ? new Date(entry.from).getFullYear().toString()
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
              <h2 className="text-2xl font-semibold text-[var(--ink)] pb-2">
                {CATEGORY_LABELS[category]}
              </h2>

              <div className="flex flex-col gap-10">
                {orderedYears.map((year) => (
                  <div key={year} className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-4">
                    <div className="text-lg sm:text-2xl font-light text-[var(--muted)] mb-2 sm:mb-0">{year}</div>
                    <ul className="m-0 list-none p-0">
                      {groups[year].map((entry) => {
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
                        const dateRange = fromFormatted
                          ? `${fromFormatted} – ${toFormatted}`
                          : "";

                        return (
                          <li
                            key={entry.slug}
                            className="border-b border-dashed border-[var(--border-dashed)]"
                          >
                            <div className="flex flex-col gap-2 py-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                  {entry.icon && (
                                    <img
                                      src={entry.icon}
                                      alt=""
                                      className="w-6 h-6 rounded object-contain flex-shrink-0"
                                    />
                                  )}
                                  <Link
                                    href={`/about/${entry.slug}`}
                                    className="inline-flex items-start sm:items-center gap-1 font-normal text-base text-[var(--ink)] hover:underline min-w-0"
                                  >
                                    <span className="line-clamp-2 sm:truncate">{entry.title ?? entry.slug}</span>
                                    <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-[var(--muted)] mt-1 sm:mt-0" />
                                  </Link>
                                </div>
                                <span className="flex-shrink-0 text-xs sm:text-sm text-[var(--muted)]">
                                  {dateRange}
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
