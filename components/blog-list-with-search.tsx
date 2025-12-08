"use client";

import { useState } from "react";
import { PostCard } from "./post-card";
import { SearchBar, type SearchResult } from "./search-bar";

type PostShape = {
  slug: string;
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  readMinutes?: number;
};

type BlogListWithSearchProps = {
  posts: PostShape[];
};

// Light layout that pairs the search bar with a flat list of posts.
export function BlogListWithSearch({ posts }: BlogListWithSearchProps) {
  const [filtered, setFiltered] = useState(posts);

  const handleResults = (results: SearchResult[], query: string) => {
    if (!query.trim()) {
      setFiltered(posts);
      return;
    }
    const slugs = new Set(results.map((r) => r.slug));
    const matches = posts.filter((p) => slugs.has(p.slug));
    setFiltered(matches);
  };

  return (
    <div className="flex flex-col gap-6">
      <SearchBar
        placeholder="Search blog posts"
        onResults={handleResults}
        helper="Vector search"
      />

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flat-card p-5 text-[var(--muted)]">
            No matches—try a different query.
          </div>
        ) : (
          filtered.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </div>
  );
}
