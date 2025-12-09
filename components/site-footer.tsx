export function SiteFooter() {
  return (
    <footer className="mt-auto py-12">
      <div className="flex flex-col items-center gap-2 text-sm text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span>Pranav Dhoolia</span>
          <span className="text-[var(--border)]">|</span>
          <a
            href="mailto:pranav@dhoolia.com"
            className="underline hover:text-[var(--ink)]"
          >
            pranav@dhoolia.com
          </a>
        </div>
      </div>
    </footer>
  );
}
