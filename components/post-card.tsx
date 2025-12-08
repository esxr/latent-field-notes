import Link from "next/link";
import { formatDate, type BlogPost } from "@/lib/blog";

type PostCardProps = {
  post: BlogPost;
  compact?: boolean;
};

export function PostCard({ post, compact }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
        <span>{formatDate(post.date)}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-sky-200">
          AI Systems
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white group-hover:text-sky-200">
        {post.title}
      </h3>
      {post.description && (
        <p className="text-sm leading-relaxed text-slate-200/80">
          {post.description}
        </p>
      )}
      {!compact && (
        <div className="text-sm font-medium text-sky-300 group-hover:translate-x-1 transition">
          Read post →
        </div>
      )}
    </Link>
  );
}
