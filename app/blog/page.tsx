import type { Metadata } from "next";
import { BlogListWithSearch } from "@/components/blog-list-with-search";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | SegmentX",
  description: "Flat, Medium-inspired posts on AI systems and evals.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return <BlogListWithSearch posts={posts} />;
}
