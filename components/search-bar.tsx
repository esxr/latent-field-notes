"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type SearchResult = {
  title: string;
  slug: string;
  description?: string;
};

type SearchBarProps = {
  placeholder?: string;
  helper?: string;
  onSelect?: (result: SearchResult) => void;
  onResults?: (results: SearchResult[], query: string) => void;
};

// Borrowed structure from Magic UI search examples; kept flat and light.
export function SearchBar({
  placeholder = "Search posts",
  helper = "Vector search across all posts",
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
    router.push(`/blog/${item.slug}`);
  };

  const hasResults = useMemo(() => results.length > 0, [results]);

  return (
    <div className="flat-card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        <span>Search bar (vector search)</span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px]">
          Cmd + K
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--ink)]/70 bg-[var(--panel)] px-3 py-2">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
        <span className="text-xs text-[var(--muted)]">
          {loading ? "Searching…" : helper}
        </span>
      </div>

      {hasResults && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
          <ul className="divide-y divide-[var(--border)]">
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
