"use client";

import Giscus from "@giscus/react";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function Comments() {
  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
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
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  );
}
