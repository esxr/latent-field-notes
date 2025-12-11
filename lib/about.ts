import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type AboutCategory = "experience" | "education" | "certificates";

export type AboutFrontmatter = {
  title?: string;
  from?: string;
  to?: string;
  description?: string;
  category?: AboutCategory;
  tags?: string[];
  icon?: string;
  draft?: boolean;
};

export type AboutEntry = {
  slug: string;
  content: string;
} & AboutFrontmatter;

const ABOUT_DIR = path.join(process.cwd(), "storage/about");

function readFile(slug: string) {
  const fullPath = path.join(ABOUT_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing about entry for slug: ${slug}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

export function getAllAboutEntrySlugs(): string[] {
  if (!fs.existsSync(ABOUT_DIR)) {
    return [];
  }
  return fs
    .readdirSync(ABOUT_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getAboutEntryBySlug(slug: string): AboutEntry {
  const raw = readFile(slug);
  const { data, content } = matter(raw);
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const fallbackTitle = headingMatch ? headingMatch[1].trim() : slug;
  const paragraphMatch = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .find((line) => line.trim() && !line.trim().startsWith("#"));

  return {
    slug,
    content,
    title: (data.title as string | undefined) ?? fallbackTitle,
    from: data.from as string | undefined,
    to: data.to as string | undefined,
    description:
      (data.description as string | undefined) ?? paragraphMatch ?? "",
    category: data.category as AboutCategory | undefined,
    tags: (data.tags as string[] | undefined) ?? [],
    icon: data.icon as string | undefined,
    draft: Boolean(data.draft),
  };
}

export function getAllAboutSlugs(): string[] {
  return getAllAboutEntrySlugs();
}

export function getAllAboutEntries(): AboutEntry[] {
  return getAllAboutEntrySlugs()
    .map(getAboutEntryBySlug)
    .filter((entry) => !entry.draft)
    .sort((a, b) => {
      if (!a.from || !b.from) return 0;
      return new Date(b.from).getTime() - new Date(a.from).getTime();
    });
}

export function getAboutSummary(): string {
  const summaryPath = path.join(ABOUT_DIR, "_summary.md");
  if (!fs.existsSync(summaryPath)) {
    return "";
  }
  const raw = fs.readFileSync(summaryPath, "utf8");
  const { content } = matter(raw);
  return content;
}
