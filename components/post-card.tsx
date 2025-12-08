"use client";

import Link from "next/link";
import { useRef } from "react";
import { VariableProximityText } from "./variable-proximity-text";

type RenderablePost = {
  slug: string;
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  readMinutes?: number;
};

type PostCardProps = {
  post: RenderablePost;
  variant?: "list" | "featured";
};

export function PostCard({ post, variant = "list" }: PostCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const isFeatured = variant === "featured";
  const title = post.title ?? post.slug;
  const formattedDate = post.date
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(post.date))
    : "";

  return (
    <Link
      href={`/blog/${post.slug}`}
      ref={cardRef}
      className={`group relative overflow-hidden bg-[var(--panel)] ${
        isFeatured ? "rounded-3xl" : "rounded-2xl"
      }`}
    >
      <div className={`relative flex flex-col gap-3 ${isFeatured ? "p-6 sm:p-8" : "p-5"}`}>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-2">
            {post.readMinutes ? (
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] text-[var(--ink)]">
                {post.readMinutes} min read
              </span>
            ) : null}
          </span>
        </div>
        <h3
          className={`text-[var(--ink)] ${
            isFeatured ? "text-2xl font-semibold" : "text-xl font-semibold"
          }`}
        >
          <VariableProximityText
            label={title}
            containerRef={cardRef}
            radius={isFeatured ? 150 : 110}
            falloff="gaussian"
            className="block"
            fromFontVariationSettings="'wght' 540, 'opsz' 18"
            toFontVariationSettings="'wght' 840, 'opsz' 36"
          />
        </h3>
        {post.description && (
          <p
            className={`leading-relaxed text-[var(--muted)] ${
              isFeatured ? "text-base" : "text-sm"
            }`}
          >
            <VariableProximityText
              label={post.description}
              containerRef={cardRef}
              radius={isFeatured ? 120 : 90}
              falloff="linear"
              className="block"
              fromFontVariationSettings="'wght' 420, 'opsz' 14"
              toFontVariationSettings="'wght' 640, 'opsz' 26"
            />
          </p>
        )}
        {!isFeatured && (
          <div className="text-sm font-medium text-[var(--ink)] underline underline-offset-4">
            <VariableProximityText
              label="Read post"
              containerRef={cardRef}
              radius={80}
              falloff="exponential"
              fromFontVariationSettings="'wght' 520, 'opsz' 14"
              toFontVariationSettings="'wght' 760, 'opsz' 24"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
