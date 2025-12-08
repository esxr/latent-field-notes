import Link from "next/link";

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
      className={`group relative block overflow-hidden bg-[var(--panel)] border border-[var(--border)] shadow-[0_0_0_1px_rgba(23,23,23,0.03)] ${
        isFeatured ? "rounded-2xl" : "rounded-xl"
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
          <div className="text-sm text-[var(--accent)] underline underline-offset-4">
            Read post
          </div>
        )}
      </div>
    </Link>
  );
}
