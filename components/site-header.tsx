"use client";

import Link from "next/link";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { state } = useSidebar();

  return (
    <header className="sticky top-0 z-50 bg-[var(--panel)]">
      <div className="flex w-full items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[var(--ink)]"
        >
          esxr.io
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--ink)]">
          <Link href="/">
            Posts
          </Link>
          {state === "collapsed" && <SidebarTrigger className="rotate-180" />}
        </nav>
      </div>
    </header>
  );
}
