"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  const pathname = usePathname();
  const segments =
    pathname === "/"
      ? ["home"]
      : ["home", ...pathname.split("/").filter(Boolean)];

  const breadcrumbs = segments.map((segment, idx) => {
    const href =
      idx === 0 ? "/" : `/${segments.slice(1, idx + 1).join("/") || ""}`;
    return { label: segment, href: href === "//" ? "/" : href };
  });
  const showHeaderSearch =
    pathname !== "/" && !pathname.startsWith("/blog");

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur">
      <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center text-lg font-black uppercase tracking-tight text-[var(--ink)]"
            >
              SegmentX
            </Link>

            <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 shadow-[0_0_0_1px_rgba(23,23,23,0.03)]">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    <Link href={crumb.href} className="hover:underline">
                      {crumb.label}
                    </Link>
                    {idx < breadcrumbs.length - 1 ? ">" : null}
                  </span>
                ))}
              </div>
            </nav>
          </div>

          {showHeaderSearch ? (
            <div className="w-full">
              <SearchBar placeholder="Search posts" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
