"use client";

import { ReactNode } from "react";

type DraggableRowProps = {
  slug: string;
  title: string;
  children: ReactNode;
  className?: string;
  /** File path relative to project root (e.g., "blogs/my-post.md" or "storage/about/entry.md") */
  path?: string;
};

export function DraggableRow({ slug, title, children, className = "", path }: DraggableRowProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Default to blogs directory if no path specified
    const filePath = path ?? `blogs/${slug}.md`;
    e.dataTransfer.setData("application/json", JSON.stringify({ slug, title, path: filePath }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`cursor-grab active:cursor-grabbing ${className}`}
      title="Drag to chat"
    >
      {children}
    </div>
  );
}
