# GitHub Issues + Giscus Comments (Markdown workflow)

Keep blog posts in `blogs/` (Markdown) and edit via PRs/branches. Enable giscus to use GitHub Issues/Discussions as the comment backend.

## Setup
- Enable **GitHub Discussions** on the repo and create a category for comments (e.g., `Comments`).
- Install the **giscus** GitHub App on the repo.
- Use https://giscus.app to fetch these values: `data-repo`, `data-repo-id`, `data-category`, `data-category-id`.
- Choose mapping: `pathname` (recommended; matches URL path) or `title` if you prefer.

## Embed snippet (add to post layout, near the bottom)
```html
<section id="comments">
  <script src="https://giscus.app/client.js"
    data-repo="OWNER/REPO"
    data-repo-id="YOUR_REPO_ID"
    data-category="Comments"
    data-category-id="YOUR_CATEGORY_ID"
    data-mapping="pathname"           <!-- use `pathname` if URLs are stable -->
    data-strict="1"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="light"
    data-lang="en"
    crossorigin="anonymous"
    async>
  </script>
</section>
```

## Options
- Want one global thread? Use `data-mapping="specific"` and set `data-term="global-comments"`.
- Dark mode: set `data-theme="dark"` or a custom theme.
- If routes are `/blog/<slug>` from `blogs/<slug>.md`, `data-mapping="pathname"` will map each post automatically.

## Workflow (no CMS)
- Keep content in `blogs/` and review via PRs.
- Optional CI: markdown lint or link check to keep PRs clean.
