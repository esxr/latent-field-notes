"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-transparent backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--ink)]"
        >
          SegmentX
        </Link>

        <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-1 rounded-full border border-[var(--ink)]/60 px-3 py-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <Link href={crumb.href} className="hover:underline">
                  {crumb.label}
                </Link>
                {idx < breadcrumbs.length - 1 ? "/" : null}
              </span>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
