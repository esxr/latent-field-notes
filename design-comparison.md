# Design Comparison: arvid.xyz vs Latent Field Notes

This document outlines the visual and structural discrepancies between [arvid.xyz/posts](https://arvid.xyz/posts/) and the local blog at `localhost:3000/blog`.

## Screenshots

| arvid.xyz | Local Blog |
|-----------|------------|
| ![arvid.xyz posts page](.playwright-mcp/arvid-posts.png) | ![local blog posts page](.playwright-mcp/local-blog.png) |

## Discrepancies

### 1. Link Hover Behavior
**Issue:** Links show underline on hover in the local blog, but arvid.xyz does not underline post links on hover.

| Behavior | arvid.xyz | Local Blog |
|----------|-----------|------------|
| Hover state | No underline | Underline appears |

**Screenshots showing hover:**
| arvid.xyz (no underline on hover) | Local Blog (underline on hover) |
|-----------------------------------|--------------------------------|
| ![arvid hover](.playwright-mcp/arvid-hover.png) | ![local hover](.playwright-mcp/local-hover.png) |

**Fix:** Add a class to post links that removes the underline on hover, or modify the global `a:hover` rule in `globals.css`:
```css
/* Option 1: Remove globally for specific link classes */
.post-link:hover {
  text-decoration: none;
}

/* Option 2: Current global rule to remove */
a:hover {
  text-decoration: underline; /* Remove this rule for post list links */
}
```

---

### 2. Year Heading Layout - Should Be Side-by-Side, Not Stacked
**Issue:** Year headings appear **above** the post list in the local blog. On arvid.xyz, the year appears **to the left/side** of the post titles in a two-column layout.

| Layout | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Year position | Left column, vertically aligned with first post | Above the post list (stacked) |

**arvid.xyz layout (simplified):**
```
2025    Leaving                           Oct 17
        ----------------------------------------

2023    Prompt Design                     Jun 11
        ----------------------------------------
```

**Local blog layout (current):**
```
2025
Making Claude Code Run for Hours          Nov 25
----------------------------------------
What the heck are PPO, GRPO, and DPO      Sep 5
----------------------------------------

2024
Comparison Of RAG Eval Frameworks         Jun 3
----------------------------------------
```

**Fix:** Change the layout from vertical stacking to a CSS Grid or Flexbox row layout:
```tsx
// Instead of flex-col, use a grid with year in first column
<div key={year} className="grid grid-cols-[100px_1fr] gap-4">
  <div className="text-2xl font-semibold text-[var(--muted)]">{year}</div>
  <ul className="m-0 list-none p-0">
    {/* posts */}
  </ul>
</div>
```

---

### 3. Year Heading Typography
**Issue:** The year headings on arvid.xyz use a lighter, thinner font weight compared to the local blog.

| Aspect | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Font weight | Light/thin (~300) | Semi-bold (600) |
| Visual prominence | Subtle, secondary | More prominent |

**Fix:** Reduce font weight:
```tsx
// Change from
className="text-2xl font-semibold text-[var(--muted)]"
// To
className="text-2xl font-light text-[var(--muted)]"
```

---

### 4. Missing Footer Section
**Issue:** arvid.xyz has a footer with author name, email, and credits. The local blog has no footer.

**arvid.xyz footer contains:**
- Author name: "Arvid Lunnemark"
- Email link: arvid.lunnemark@gmail.com
- Technology credits: "Hugo and hello-friend"

**Fix:** Add a footer component to the layout or page.

---

### 5. Header/Navigation Styling
**Issue:** Minor differences in navigation layout.

| Aspect | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Logo position | Left | Left |
| Nav items | Separated in a horizontal list with equal spacing | Flex row with gaps |
| Visual separation | Clear separation between logo and nav | Similar but header has border-bottom |

The local blog has a border line under the header which arvid.xyz does not appear to have (or it's more subtle).

---

### 6. Post Item Border Style
**Issue:** Both use dashed borders, but there may be subtle differences in color/opacity.

| Aspect | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Border style | Dashed, light gray | Dashed, using `--border-dashed` |

The implementation appears similar, but verify the exact color matches.

---

### 7. Content Width/Margins
**Issue:** The content area width and margins may differ slightly.

| Aspect | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Max width | ~800px (estimated) | 840px (`page-shell`) |
| Side padding | Generous | 20px |

---

### 8. Post Title Font Weight
**Issue:** Post titles on arvid.xyz appear to have a normal/regular font weight, while the local blog may be inheriting a different weight.

**Fix:** Ensure post titles use `font-normal` (400 weight):
```tsx
<span className="flex-1 font-normal">{post.title ?? post.slug}</span>
```

---

### 9. Date Alignment and Spacing
**Issue:** The date appears on the far right on both, but the spacing/padding inside the row may differ.

| Aspect | arvid.xyz | Local Blog |
|--------|-----------|------------|
| Padding | More generous vertical padding | `py-4` (16px) |

---

## Priority Changes

1. **High Priority:**
   - [ ] Remove underline on hover for post links
   - [ ] Move year headings to the side (grid layout)

2. **Medium Priority:**
   - [ ] Adjust year heading font weight to lighter
   - [ ] Add footer section

3. **Low Priority:**
   - [ ] Fine-tune spacing and padding
   - [ ] Match exact border colors
   - [ ] Verify content max-width

---

## Summary

The main structural difference is the **year heading layout** - arvid.xyz uses a side-by-side layout where the year sits in a left column aligned with the posts, while the local blog stacks the year above the posts. The second most noticeable issue is the **underline on hover** behavior for links.
