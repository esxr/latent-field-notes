"use client";

import Giscus from "@giscus/react";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function Comments() {
  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
        Comments are disabled. Add giscus credentials to your environment
        variables to enable per-post discussions.
      </div>
    );
  }

  const giscusRepo = repo as `${string}/${string}`;

  return (
    <Giscus
      id="comments"
      repo={giscusRepo}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme="light"
      lang="en"
      loading="lazy"
    />
  );
}
