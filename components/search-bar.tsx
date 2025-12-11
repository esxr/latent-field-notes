"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type SearchResult = {
  title: string;
  slug: string;
  description?: string;
};

type SearchBarProps = {
  placeholder?: string;
  className?: string;
  onSelect?: (result: SearchResult) => void;
  onResults?: (results: SearchResult[], query: string) => void;
};

// Minimal inline search field with async results and optional callbacks.
export function SearchBar({
  placeholder = "Search posts",
  className,
  onSelect,
  onResults,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchResults = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      onResults?.([], term);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = (await res.json()) as { results: SearchResult[] };
      const fetched = data.results ?? [];
      setResults(fetched);
      onResults?.(fetched, term);
    } catch {
      setResults([]);
      onResults?.([], term);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 220);
  };

  const handleSelect = (item: SearchResult) => {
    if (onSelect) onSelect(item);
    router.push(`/${item.slug}`);
  };

  const hasResults = useMemo(() => results.length > 0, [results]);

  const outerClassName = ["relative w-full", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={outerClassName}>
      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 shadow-[0_0_0_1px_rgba(23,23,23,0.03)] transition focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
        <Search className="h-4 w-4 flex-shrink-0 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] sm:text-base"
        />
        {loading ? (
          <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            ...
          </span>
        ) : null}
      </div>

      {hasResults && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-[var(--muted)]/10 bg-[var(--panel)] shadow-lg">
          <ul className="divide-y divide-[var(--muted)]/10">
            {results.map((item) => (
              <li
                key={item.slug}
                className="cursor-pointer px-4 py-3 hover:bg-[var(--accent-soft)]"
                onClick={() => handleSelect(item)}
              >
                <div className="text-sm font-semibold text-[var(--ink)]">
                  {item.title}
                </div>
                {item.description && (
                  <p className="text-sm text-[var(--muted)] line-clamp-2">
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
