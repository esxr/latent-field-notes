# Drag-and-Drop Context for Chat

## Problem Statement

Users want to provide focused context to the chat assistant by dragging post titles from the blog index page into the chat input. This allows the assistant to know which specific content to focus on when answering questions.

### Requirements

1. **Draggable Sources**: Post titles on the `/blog` page should be draggable
2. **Drop Target**: The chat input area should accept dropped items
3. **Context Display**: Dropped items appear as removable chips/badges above the input
4. **Multi-select**: Users can drop multiple posts to cross-reference content
5. **Agent Behavior**: The API should tell the agent which files to focus on (not auto-inject content)

## Implementation Proposal

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Blog Index Page                                                │
│  ─────────────────                                              │
│  Post titles wrapped with DraggablePostTitle component          │
│  On drag: sets dataTransfer with { slug, title }                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTML5 drag (dataTransfer)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Chat Panel (Drop Target)                                       │
│  ─────────────────────────                                      │
│  • Shows removable "context chips" for dropped items            │
│  • User types question alongside context                        │
│  • Submit sends { messages, context: [slugs] }                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Route                                                      │
│  ─────────────────────                                          │
│  • Receives context array of slugs                              │
│  • Modifies system prompt to instruct agent to focus on files   │
│  • Agent uses Read tool to fetch content when needed            │
└─────────────────────────────────────────────────────────────────┘
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌─────────────────────┐  │
│  │ PPO, GRPO, and DPO    × │  │ RAG Eval Frameworks × │  │
│  └──────────────────────────┘  └─────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ What are the key differences between these?      │↗││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
        ↑ chips (removable)              ↑ send button
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/draggable-post-title.tsx` | **Create** | Wrapper component that makes post titles draggable |
| `app/blog/page.tsx` | **Modify** | Use DraggablePostTitle for post titles |
| `components/chat-panel.tsx` | **Modify** | Add drop zone, context chips state, pass context to API |
| `app/api/chat/route.ts` | **Modify** | Accept context array, update system prompt |

### Detailed Implementation

#### 1. `components/draggable-post-title.tsx` (New)

```tsx
"use client";

import { ReactNode } from "react";

type DraggablePostTitleProps = {
  slug: string;
  title: string;
  children: ReactNode;
};

export function DraggablePostTitle({ slug, title, children }: DraggablePostTitleProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ slug, title }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <span
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </span>
  );
}
```

#### 2. `app/blog/page.tsx` Changes

- Import `DraggablePostTitle`
- Wrap the post title `<span>` with `DraggablePostTitle`
- Pass `slug` and `title` props

#### 3. `components/chat-panel.tsx` Changes

Add state:
```tsx
const [contextItems, setContextItems] = useState<Array<{ slug: string; title: string }>>([]);
```

Add drop handlers to the input container:
```tsx
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  try {
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (data.slug && data.title) {
      setContextItems(prev => {
        if (prev.some(item => item.slug === data.slug)) return prev;
        return [...prev, { slug: data.slug, title: data.title }];
      });
    }
  } catch {}
};

const removeContextItem = (slug: string) => {
  setContextItems(prev => prev.filter(item => item.slug !== slug));
};
```

Add chips UI above textarea:
```tsx
{contextItems.length > 0 && (
  <div className="flex flex-wrap gap-2 px-3 pt-3">
    {contextItems.map(item => (
      <span key={item.slug} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--accent-soft)] rounded-full">
        <span className="truncate max-w-[150px]">{item.title}</span>
        <button onClick={() => removeContextItem(item.slug)} className="hover:text-red-500">×</button>
      </span>
    ))}
  </div>
)}
```

Update fetch to include context:
```tsx
body: JSON.stringify({
  messages: [...messages, userMsg],
  context: contextItems.map(c => c.slug)
}),
```

#### 4. `app/api/chat/route.ts` Changes

Accept context from request:
```tsx
const { messages, context } = await req.json();
```

Update system prompt:
```tsx
let systemPrompt = "You can search the web and read local blog files in the ./blogs/ directory.";

if (context && context.length > 0) {
  const fileList = context.map((slug: string) => `./blogs/${slug}.md`).join(", ");
  systemPrompt += ` The user has selected specific posts for context. Focus primarily on these files: ${fileList}. Use the Read tool to access their content.`;
}
```

### Testing Checklist

- [ ] Post titles on /blog are draggable (cursor changes, drag ghost appears)
- [ ] Dragging a title over chat input shows drop indicator
- [ ] Dropping adds a chip with truncated title
- [ ] Clicking × removes the chip
- [ ] Dropping same post twice does not duplicate
- [ ] Multiple posts can be added
- [ ] Submitting a question with context sends slugs to API
- [ ] Agent response acknowledges/uses the focused content
