import "./drag-demo.css";

/**
 * DragDemo - Pure CSS animated tutorial showing how to drag a blog post
 * from the sidebar into the chat context area.
 *
 * Features:
 * - 4-second looping animation
 * - Animated cursor (pointer → grab hand)
 * - Ghost element following cursor during drag
 * - Pill appearing in context area on drop
 * - Respects prefers-reduced-motion
 */
export function DragDemo() {
  return (
    <div className="drag-demo" role="img" aria-label="Drag and drop tutorial animation">
      {/* Left panel: Blog post list */}
      <div className="drag-demo__left">
        <div className="drag-demo__post" />
        <div className="drag-demo__post drag-demo__post--active" />
        <div className="drag-demo__post" />
      </div>

      {/* Vertical divider */}
      <div className="drag-demo__divider" />

      {/* Right panel: Chat input */}
      <div className="drag-demo__right">
        <div className="drag-demo__input" />
      </div>

      {/* Animated cursor - simple triangle */}
      <div className="drag-demo__cursor">
        <svg
          className="drag-demo__cursor-icon"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0 L0 14 L4 10 L14 10 Z" />
        </svg>
      </div>

      {/* Ghost element (dragged post) */}
      <div className="drag-demo__ghost" />
    </div>
  );
}
