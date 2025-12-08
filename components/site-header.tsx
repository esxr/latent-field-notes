import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
];

const repoUrl =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? "https://github.com/";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white"
        >
          <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_0_6px_rgba(56,189,248,0.25)]" />
          Latent Field Notes
        </Link>

        <nav className="flex items-center gap-2 text-sm text-slate-200">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={repoUrl}
            className="rounded-full bg-white/10 px-4 py-2 text-sky-200 transition hover:bg-white/20"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </Link>
        </nav>
      </div>
    </header>
  );
}
