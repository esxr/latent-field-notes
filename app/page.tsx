import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { SearchBar } from "@/components/search-bar";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;
  const latest = rest.slice(0, 4);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SearchBar placeholder="Search blog posts" />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Featured
        </p>
        {featured ? (
          <PostCard key={featured.slug} post={featured} variant="featured" />
        ) : (
          <div className="flat-card p-5 text-[var(--muted)]">
            No featured post yet.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        {latest.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>

      <div className="flex justify-center">
        <Link href="/blog" className="flat-button text-sm lowercase">
          more
        </Link>
      </div>
    </div>
  );
}
