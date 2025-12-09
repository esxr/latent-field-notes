import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Posts",
  description: "Chronological list of posts.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const groups = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = post.date
      ? new Date(post.date).getFullYear().toString()
      : "Other";
    acc[year] = acc[year] || [];
    acc[year].push(post);
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

  return (
    <section className="page-shell flex flex-col gap-10">
      <header>
        <h1 className="mb-6 mt-2">Posts</h1>
      </header>

      <div className="flex flex-col gap-10">
        {orderedYears.map((year) => (
          <div key={year} className="grid grid-cols-[100px_1fr] gap-4">
            <div className="text-2xl font-light text-[var(--muted)]">{year}</div>
            <ul className="m-0 list-none p-0">
              {groups[year].map((post) => {
                const formatted =
                  post.date && !Number.isNaN(new Date(post.date).getTime())
                    ? new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(post.date))
                    : "";
                return (
                  <li
                    key={post.slug}
                    className="border-b border-dashed border-[var(--border-dashed)]"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-baseline justify-between gap-4 py-4 text-base text-[var(--ink)]"
                    >
                      <span className="flex-1 font-normal">{post.title ?? post.slug}</span>
                      <span className="flex-shrink-0 text-sm text-[var(--muted)]">
                        {formatted}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
