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
              className="font-mono text-md bg-[var(--ink)] text-[var(--bg)] px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
            >
              Chat With Me!
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
