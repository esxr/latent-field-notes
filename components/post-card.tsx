import Link from "next/link";
import { ShapeBlur } from "./shape-blur";

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
      className={`group relative overflow-hidden bg-[var(--panel)] ${
        isFeatured ? "rounded-3xl" : "rounded-2xl"
      }`}
    >
      <ShapeBlur
        className="pointer-events-none absolute inset-0 opacity-45"
        variation={isFeatured ? 0 : 2}
        shapeSize={isFeatured ? 0.8 : 0.9}
        roundness={0.6}
        borderSize={0.07}
        circleSize={0.55}
        circleEdge={1}
      />
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
          {title}
        </h3>
        {post.description && (
          <p
            className={`leading-relaxed text-[var(--muted)] ${
              isFeatured ? "text-base" : "text-sm"
            }`}
          >
            {post.description}
          </p>
        )}
        {!isFeatured && (
          <div className="text-sm font-medium text-[var(--ink)] underline underline-offset-4">
            Read post
          </div>
        )}
      </div>
    </Link>
  );
}
