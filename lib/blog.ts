import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type BlogFrontmatter = {
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
  draft?: boolean;
};

export type BlogPost = {
  slug: string;
  content: string;
  readMinutes?: number;
} & BlogFrontmatter;

const BLOGS_DIR = path.join(process.cwd(), "blogs");

function readFile(slug: string) {
  const fullPath = path.join(BLOGS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing post for slug: ${slug}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

export function getAllPostSlugs(): string[] {
  return fs
    .readdirSync(BLOGS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): BlogPost {
  const raw = readFile(slug);
  const { data, content } = matter(raw);
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const fallbackTitle = headingMatch ? headingMatch[1].trim() : slug;
  const paragraphMatch = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .find((line) => line.trim() && !line.trim().startsWith("#"));
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 220));

  return {
    slug,
    content,
    title: (data.title as string | undefined) ?? fallbackTitle,
    date: data.date as string | undefined,
    description:
      (data.description as string | undefined) ?? paragraphMatch ?? "",
    tags: (data.tags as string[] | undefined) ?? [],
    draft: Boolean(data.draft),
    readMinutes,
  };
}

export function getAllPosts(): BlogPost[] {
  return getAllPostSlugs()
    .map(getPostBySlug)
    .filter((post) => !post.draft)
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function formatDate(date?: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
