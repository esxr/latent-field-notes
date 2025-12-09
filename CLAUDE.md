# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is "Latent Field Notes" - a markdown-first blog built with Next.js 16 (App Router) focused on AI systems, evals, and alignment notes. Blog posts are stored as markdown files in `/blogs` with frontmatter metadata. The site includes a RAG-powered chat feature that answers questions grounded in the blog content using runtime vector embeddings.

## Development Commands

```bash
# Start development server (Turbopack enabled by default in Next.js 16)
npm run dev

# Build for production (generates static pages for all non-draft posts)
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## Architecture

### Content System

**Blog Post Lifecycle** (`lib/blog.ts`):
- Posts live in `/blogs/*.md` as individual markdown files
- Each post has YAML frontmatter: `title`, `date`, `description`, `tags`, `draft`, `hero`
- `getAllPosts()` reads all `.md` files, filters out drafts, sorts by date descending
- `getPostBySlug()` reads single post, falls back to extracting title from first `# heading` if frontmatter missing
- Word count and read time (220 words/min) calculated at read time
- Posts with `draft: true` are excluded from both index and static generation

**Static Generation** (`app/blog/[slug]/page.tsx`):
- `generateStaticParams()` pre-renders all post pages at build time
- `generateMetadata()` creates SEO metadata from frontmatter

### RAG Chat System

**Vector Store** (`lib/vector-store.ts`):
- At runtime, all published posts are chunked (700 words, 120 word overlap)
- Batch embedded using OpenAI's `text-embedding-3-small` via `ai` SDK's `embedMany()`
- Stored in-memory with singleton cache (`cachedChunks`)
- `topK()` performs cosine similarity search to retrieve relevant chunks

**Chat API** (`app/api/chat/route.ts`):
- Embeds user question with same model
- Retrieves top 4 matching chunks via cosine similarity
- Streams response using `streamText()` with GPT-4.1-mini
- System prompt constrains answers to provided context only

**Client** (`components/chat-panel.tsx`):
- Streams response chunks via `ReadableStream` reader
- Updates assistant message incrementally as chunks arrive

### Markdown Rendering

**Rehype/Remark Pipeline** (`components/markdown.tsx`):
- `remark-gfm` - GitHub Flavored Markdown (tables, strikethrough, task lists)
- `rehype-slug` - Auto-generate heading IDs
- `rehype-autolink-headings` - Wrap headings in anchor links
- `rehype-highlight` - Syntax highlighting for code blocks
- `rehype-external-links` - Add `target="_blank"` to external links

### Comments

Uses giscus for GitHub Discussions-based comments (`components/comments.tsx`). Each blog post maps to a discussion thread by pathname.

## Environment Variables

Required for production (copy `.env.example` to `.env.local`):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/yourname/repo
NEXT_PUBLIC_GISCUS_REPO=yourname/repo
NEXT_PUBLIC_GISCUS_REPO_ID=...
NEXT_PUBLIC_GISCUS_CATEGORY=Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=...
OPENAI_API_KEY=...  # Required for /chat RAG feature
```

## Key Technical Details

- **Import alias**: `@/*` maps to project root (configured in `tsconfig.json`)
- **Font setup**: Inter (UI sans) + Source Code Pro (monospace) loaded via `next/font/google` in `app/layout.tsx`
- **File tracing**: `next.config.ts` includes `./blogs/**/*` in output bundle to ensure markdown files are deployed
- **Styling**: Tailwind CSS v4 with CSS variables for theming (`--bg`, `--ink`, `--muted`, `--border`, `--panel`, `--accent`)
- **Dynamic routes**: Chat API forces dynamic rendering (`export const dynamic = "force-dynamic"`)

## Adding New Blog Posts

1. Create `/blogs/new-slug.md` with frontmatter:
   ```yaml
   ---
   title: "Your Title"
   date: "2024-12-09"
   description: "Short description"
   tags: ["tag1", "tag2"]
   draft: false
   ---
   ```
2. Build will auto-generate static page at `/blog/new-slug`
3. Post appears in index if `draft: false`
4. RAG chat will automatically include it in vector store
