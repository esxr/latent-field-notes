# Next.js + shadcn Blog with GitHub as CMS and giscus Discussions
*(Single repo, plain `.md` content in `/blogs`)*

This stack uses:
- **Next.js + shadcn + Tailwind**
- **GitHub as CMS** (plain Markdown content stored in `/blogs`)
- **giscus** for GitHub Discussions-based comments
- **Single repo** for both code and content
- **UI** - shadcn/ui + reactbits.dev + magic-ui component libraries

---

## 1. Big Picture Architecture

- **Content CMS (GitHub)**: Code and content live in the same repo under `/blogs/*.md`; posts are edited via GitHub UI/PRs.
- **Next.js**: App Router (`app/blog/page.tsx` + `app/blog/[slug]/page.tsx`); read files from `/blogs` at build time or via ISR; Tailwind + shadcn/ui handle layout/typography (checkout reactbits.dev + magic-ui component libraries)
- **Comments**: giscus React component bound to a GitHub Discussions repo; `pathname` mapping gives each URL its own thread.
- **Content format**: Plain Markdown (`.md`), rendered with `react-markdown`.

---

## 2. Suggested File Layout

```txt
.
├─ app/
│  ├─ blog/
│  │  ├─ page.tsx           // blog index (list of posts)
│  │  └─ [slug]/
│  │     └─ page.tsx        // single post page
├─ blogs/
│  ├─ my-first-post.md
│  ├─ another-post.md
│  └─ ...
├─ lib/
│  └─ blog.ts               // helpers to load/parse markdown
├─ components/
│  ├─ markdown.tsx          // Markdown renderer (react-markdown)
│  └─ comments.tsx          // giscus integration
```

- `/blogs` is the CMS folder edited in GitHub/PRs.
- `lib/blog.ts` turns files into data for Next.js.
- `components/markdown.tsx` encapsulates Markdown → JSX rendering.

---

## 3. Loading Markdown from /blogs (GitHub as CMS)

### 3.1 Install dependencies

```bash
npm install gray-matter react-markdown
# or
pnpm add gray-matter react-markdown
```

### 3.2 `lib/blog.ts`

```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOGS_DIR = path.join(process.cwd(), "blogs");

export type BlogMeta = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  draft?: boolean;
};

export type BlogPost = BlogMeta & {
  content: string;
};

export function getAllPostSlugs(): string[] {
  return fs
    .readdirSync(BLOGS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): BlogPost {
  const fullPath = path.join(BLOGS_DIR, `${slug}.md`);
  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString(),
    description: data.description ?? "",
    draft: data.draft ?? false,
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  return getAllPostSlugs()
    .map(getPostBySlug)
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
```

### 3.3 Example blog post file

`blogs/my-first-post.md`:

```md
---
title: "My first post"
date: "2025-12-01"
description: "Trying out my GitHub-powered blog."
draft: false
---

# Hello

This is **plain Markdown** content, stored in the `/blogs` folder and edited via GitHub.
```

---

## 4. Markdown Rendering Component

`components/markdown.tsx`:

```tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

type MarkdownProps = {
  content: string;
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown className="prose dark:prose-invert max-w-none">
      {content}
    </ReactMarkdown>
  );
}
```

`className` uses Tailwind's prose utilities (`@tailwindcss/typography`). Add the plugin in your Tailwind config.

---

## 5. App Router Pages for the Blog

### 5.1 Blog index page: `app/blog/page.tsx`

```tsx
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="text-lg font-medium hover:underline"
            >
              {post.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {new Date(post.date).toLocaleDateString()}
            </p>
            {post.description && (
              <p className="text-sm text-muted-foreground">
                {post.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5.2 Single post route: `app/blog/[slug]/page.tsx`

```tsx
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { Markdown } from "@/components/markdown";
import { Comments } from "@/components/comments";

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  return (
    <article className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(post.date).toLocaleDateString()}
        </p>
        {post.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {post.description}
          </p>
        )}
      </header>

      <Markdown content={post.content} />

      <section className="mt-12">
        <Comments />
      </section>
    </article>
  );
}
```

---

## 6. Wiring giscus for GitHub Discussions

### 6.1 Configure giscus

1. Go to https://giscus.app.
2. Set the repo for comments (e.g. `yourname/your-blog-repo`; can be the same repo).
3. Enable Discussions in that repo.
4. Create a category like `Comments`.
5. In the giscus config UI, set:
   - Mapping: `pathname`
   - Theme: `preferred_color_scheme`
   - Reactions: enabled
   - Input position: bottom

Generated snippet (values replaced with your IDs):

```html
<script src="https://giscus.app/client.js"
        data-repo="yourname/your-blog-repo"
        data-repo-id="..."
        data-category="Comments"
        data-category-id="..."
        data-mapping="pathname"
        data-theme="preferred_color_scheme"
        async>
</script>
```

### 6.2 Install the React component

```bash
npm install @giscus/react
# or
pnpm add @giscus/react
```

### 6.3 Create a Comments client component

`components/comments.tsx`:

```tsx
"use client";

import Giscus from "@giscus/react";

export function Comments() {
  return (
    <Giscus
      id="comments"
      repo="yourname/your-blog-repo"
      repoId="YOUR_REPO_ID"
      category="Comments"
      categoryId="YOUR_CATEGORY_ID"
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  );
}
```

- `repo`, `repoId`, `category`, `categoryId`, etc. come from the data attributes on giscus.app (remove `data-`, convert to camelCase).
- `mapping="pathname"` ensures each URL (e.g. `/blog/my-first-post`) gets its own discussion, created on first load.

Use it in the post page:

```tsx
<section className="mt-12">
  <Comments />
</section>
```

---

## 7. How This Plays with shadcn/ui

Wrap sections with shadcn primitives; example Card around comments:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Comments } from "@/components/comments";

export function CommentsSection() {
  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <Comments />
      </CardContent>
    </Card>
  );
}
```

Apply similarly to blog index cards, author/profile sections, sidebars, tags, etc. giscus renders in an `<iframe>`, so Tailwind/shadcn styles do not affect its internal UI; you control the surrounding layout.

---

## 8. Next Steps Checklist

1. Create `/blogs` and add a couple of `.md` posts with frontmatter.
2. Add `lib/blog.ts`; confirm `getAllPosts` and `getPostBySlug` work.
3. Add `react-markdown` and the `Markdown` component.
4. Wire App Router pages: `app/blog/page.tsx` and `app/blog/[slug]/page.tsx`.
5. Configure giscus and add the `Comments` component.
6. Wrap UI in shadcn components for polish.

Outcome: Markdown stored in `/blogs` in one repo, styled with Tailwind + shadcn/ui, with GitHub Discussions comments via giscus. You can evolve the design without changing the content model.
