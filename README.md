# Pranav Dhoolia

This is "Pranav Dhoolia" - Pranav Dhoolia's personal blog discussing about AI systems, evals, and fine-tuning, and his career. Built with Next.js (App Router), Tailwind/shadcn-inspired UI, and giscus for GitHub Discussions-based comments. Content lives in `/blogs/*.md`; edit via PRs like a tiny GitHub CMS.

## Stack
- Next.js 16 (App Router) + Turbopack
- Tailwind CSS v4 + shadcn-style components
- `gray-matter` + `react-markdown` for frontmatter + rendering
- giscus for comments (one discussion per pathname)

## Development
```bash
npm install
npm run dev
# open http://localhost:3000
```

Posts are pulled from `/blogs` at build time, sorted by frontmatter dates, and rendered with ReactMarkdown + remark/rehype plugins.

## Environment variables
Copy `.env.example` to `.env.local` and fill in the values:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/yourname/your-blog-repo
NEXT_PUBLIC_GISCUS_REPO=yourname/your-blog-repo
NEXT_PUBLIC_GISCUS_REPO_ID=REPLACE_WITH_REPO_ID
NEXT_PUBLIC_GISCUS_CATEGORY=Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=REPLACE_WITH_CATEGORY_ID
```
- `NEXT_PUBLIC_SITE_URL` drives metadata canonical URLs.
- `NEXT_PUBLIC_GISCUS_*` come from the giscus config screen (mapping = `pathname`).

## Content model
- Add a Markdown file to `/blogs` with frontmatter:
  ```md
  ---
title: "Post title"
date: "2024-12-01"
description: "Short teaser."
tags: ["evals", "rag"]
hero: "/images/your-hero.jpg" # optional
draft: false
---
  ```
- Files with `draft: true` are ignored on the index and static generation.

## Commands
- `npm run dev` – start the dev server
- `npm run lint` – eslint
- `npm run build` – production build/SSG

## Chat over the blog (RAG)
- Deploy with `OPENAI_API_KEY` set (e.g., in `.env.local` for dev, Vercel project env for prod).
- The `/chat` page streams answers grounded in the markdown posts using an in-memory vector store built at runtime from `/blogs`.

## Comments via giscus
1) Enable Discussions on the GitHub repo and install the giscus app.
2) Create a category (e.g., `Comments`).
3) Copy `repo`, `repo_id`, `category`, and `category_id` from https://giscus.app into `.env.local`.
4) Redeploy; each `/blog/[slug]` page will render a dedicated thread based on the URL pathname.
