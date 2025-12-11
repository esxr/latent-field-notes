"use client";

import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { state, toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-50 bg-[var(--panel)]">
      <div className="flex w-full items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[var(--ink)]"
        >
          Pranav Dhoolia
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--ink)]">
          {(isMobile || state === "collapsed") && (
            <button
              onClick={toggleSidebar}
              className="font-mono text-md bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--ink)] transition-colors"
            >
              /chat
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
