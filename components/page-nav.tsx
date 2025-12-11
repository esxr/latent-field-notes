"use client";

import Link from "next/link";

type PageNavProps = {
  active: "posts" | "about";
};

// Shared heading styles to match h1 from globals.css
const headingBase = "text-[2.625rem] font-extrabold leading-[1.3] tracking-normal max-[684px]:text-[2rem]";

export function PageNav({ active }: PageNavProps) {
  return (
    <nav className="flex items-baseline gap-4 mb-6 mt-2">
      {active === "posts" ? (
        <h1 className={headingBase} style={{ color: "var(--ink)" }}>Posts</h1>
      ) : (
        <Link
          href="/"
          className={`${headingBase} transition-colors duration-200`}
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#555555"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
        >
          Posts
        </Link>
      )}
      {active === "about" ? (
        <h1 className={headingBase} style={{ color: "var(--ink)" }}>About</h1>
      ) : (
        <Link
          href="/about"
          className={`${headingBase} transition-colors duration-200`}
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#555555"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
        >
          About
        </Link>
      )}
    </nav>
  );
}
