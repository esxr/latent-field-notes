"use client";

import Link from "next/link";

type PageNavProps = {
  active: "posts" | "about";
};

// Shared text styles to match h1 from globals.css
const textBase = "text-[2.625rem] leading-[1.3] tracking-normal max-[684px]:text-[2rem]";
const activeStyle = `${textBase} font-extrabold`;
const inactiveStyle = `${textBase} font-normal transition-colors duration-200`;
const separatorStyle = `${textBase} font-normal select-none`;

export function PageNav({ active }: PageNavProps) {
  return (
    <nav className="flex items-baseline justify-center mb-6 mt-2">
      {active === "posts" ? (
        <span className={activeStyle} style={{ color: "var(--ink)" }}>Posts</span>
      ) : (
        <Link
          href="/"
          className={inactiveStyle}
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#555555"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
        >
          Posts
        </Link>
      )}

      <span className={separatorStyle} style={{ color: "var(--muted)" }}>&nbsp;|&nbsp;</span>

      {active === "about" ? (
        <span className={activeStyle} style={{ color: "var(--ink)" }}>About</span>
      ) : (
        <Link
          href="/about"
          className={inactiveStyle}
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
