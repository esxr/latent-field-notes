"use client";

import Link from "next/link";
export function SiteHeader() {
  return (
    <header className="bg-[var(--panel)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-7">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[var(--ink)]"
        >
          Latent Field Notes
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--ink)]">
          <Link href="/">
            Home
          </Link>
          <Link href="/blog">
            Posts
          </Link>
          <Link href="/chat">
            Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}
