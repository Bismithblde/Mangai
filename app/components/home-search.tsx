"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type SearchResult = {
  id: string;
  title: string;
  year?: string;
  type?: string;
};

type QueryCacheEntry = {
  titles: string[];
  expiresAt: number;
};

const AUTOCOMPLETE_DEBOUNCE_MS = 200;
const MIN_AUTOCOMPLETE_CHARS = 2;
const SUGGESTION_LIMIT = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;

type TrieNode = {
  children: Map<string, TrieNode>;
  suggestions: string[];
};

class TitleTrie {
  private readonly root: TrieNode;

  constructor() {
    this.root = {
      children: new Map<string, TrieNode>(),
      suggestions: [],
    };
  }

  insert(title: string) {
    const normalized = title.trim();
    if (!normalized) {
      return;
    }

    const lower = normalized.toLowerCase();
    let node = this.root;

    for (const char of lower) {
      const next = node.children.get(char);
      if (next) {
        node = next;
      } else {
        const created: TrieNode = { children: new Map(), suggestions: [] };
        node.children.set(char, created);
        node = created;
      }

      if (!node.suggestions.includes(normalized)) {
        node.suggestions.push(normalized);
      }

      if (node.suggestions.length > 20) {
        node.suggestions = node.suggestions.slice(0, 20);
      }
    }
  }

  lookup(prefix: string, limit = 8): string[] {
    const normalized = prefix.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    let node = this.root;
    for (const char of normalized) {
      const next = node.children.get(char);
      if (!next) {
        return [];
      }
      node = next;
    }

    return node.suggestions.slice(0, limit);
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeApiResults(payload: unknown): SearchResult[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  
  // New unified API returns { data: [...], total, limit, offset }
  const dataArray = data.data;
  if (!Array.isArray(dataArray)) {
    return [];
  }

  const mapped: SearchResult[] = [];

  for (const item of dataArray) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Record<string, unknown>;
    const title = asString(row.title);
    if (!title) {
      continue;
    }

    // New API format: id, title, description, status, year, rating, source
    const id = asString(row.id) ?? `${title}-${mapped.length}`;
    const year = typeof row.year === "number" ? String(row.year) : undefined;
    const type = asString(row.source) ?? undefined;

    mapped.push({ id, title, year, type });
  }

  return mapped;
}

function rankTitles(query: string, titles: string[], limit: number): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const unique = Array.from(new Set(titles));

  unique.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aPrefix = aLower.startsWith(normalizedQuery);
    const bPrefix = bLower.startsWith(normalizedQuery);

    if (aPrefix !== bPrefix) {
      return aPrefix ? -1 : 1;
    }

    const aIndex = aLower.indexOf(normalizedQuery);
    const bIndex = bLower.indexOf(normalizedQuery);
    const aHas = aIndex >= 0;
    const bHas = bIndex >= 0;

    if (aHas !== bHas) {
      return aHas ? -1 : 1;
    }

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    if (a.length !== b.length) {
      return a.length - b.length;
    }

    return a.localeCompare(b);
  });

  return unique.slice(0, limit);
}

type HomeSearchProps = {
  userEmail: string;
};

export default function HomeSearch({ userEmail }: HomeSearchProps) {
  const trieRef = useRef(new TitleTrie());
  const knownTitlesRef = useRef(new Set<string>());
  const cacheRef = useRef(new Map<string, QueryCacheEntry>());
  const autocompleteAbortRef = useRef<AbortController | null>(null);
  const latestAutocompleteRequestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const queryInfo = useMemo(() => {
    const trimmed = query.trim();
    return {
      trimmed,
      canSearch: trimmed.length > 0,
    };
  }, [query]);

  const addTitlesToTrie = (titles: string[]) => {
    for (const title of titles) {
      if (knownTitlesRef.current.has(title)) {
        continue;
      }

      knownTitlesRef.current.add(title);
      trieRef.current.insert(title);
    }
  };

  const readCachedTitles = (queryText: string): string[] | null => {
    const key = queryText.toLowerCase();
    const entry = cacheRef.current.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.titles;
  };

  const writeCachedTitles = (queryText: string, titles: string[]) => {
    cacheRef.current.set(queryText.toLowerCase(), {
      titles,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  };

  const fetchSearchResults = async (
    queryText: string,
    limit: number,
    signal?: AbortSignal,
  ): Promise<SearchResult[]> => {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: queryText,
        limit,
        offset: 0,
        fallbackToMangaUpdates: true,
      }),
      signal,
    });

    const data = (await response.json()) as unknown;

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Search request failed.";

      throw new Error(message);
    }

    return normalizeApiResults(data);
  };

  const mergeAndSetSuggestions = (queryText: string, sources: string[][]) => {
    const merged = rankTitles(queryText, sources.flat(), SUGGESTION_LIMIT);
    setSuggestions(merged);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    const nextSuggestions = trieRef.current.lookup(value, SUGGESTION_LIMIT);
    setSuggestions(nextSuggestions);
  };

  const handleSuggestionPick = (title: string) => {
    setQuery(title);
    setSuggestions(trieRef.current.lookup(title, SUGGESTION_LIMIT));
  };

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_AUTOCOMPLETE_CHARS) {
      setSuggestions(trieRef.current.lookup(trimmed, SUGGESTION_LIMIT));
      autocompleteAbortRef.current?.abort();
      autocompleteAbortRef.current = null;
      return;
    }

    const localTitles = trieRef.current.lookup(trimmed, 25);
    const cachedTitles = readCachedTitles(trimmed);

    if (cachedTitles) {
      mergeAndSetSuggestions(trimmed, [localTitles, cachedTitles]);
      return;
    }

    const timer = window.setTimeout(async () => {
      const requestId = ++latestAutocompleteRequestIdRef.current;

      autocompleteAbortRef.current?.abort();
      const controller = new AbortController();
      autocompleteAbortRef.current = controller;

      try {
        const remoteResults = await fetchSearchResults(
          trimmed,
          SUGGESTION_LIMIT,
          controller.signal,
        );
        const remoteTitles = remoteResults.map((result) => result.title);

        addTitlesToTrie(remoteTitles);
        writeCachedTitles(trimmed, remoteTitles);

        if (requestId !== latestAutocompleteRequestIdRef.current) {
          return;
        }

        const freshLocal = trieRef.current.lookup(trimmed, 25);
        mergeAndSetSuggestions(trimmed, [freshLocal, remoteTitles]);
      } catch (autocompleteError) {
        if (
          autocompleteError instanceof Error &&
          autocompleteError.name === "AbortError"
        ) {
          return;
        }
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    return () => {
      autocompleteAbortRef.current?.abort();
    };
  }, []);

  const handleSubmitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!queryInfo.canSearch) {
      setResults([]);
      setHasSearched(true);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const normalized = await fetchSearchResults(queryInfo.trimmed, 20);
      setResults(normalized);

      const titles = normalized.map((item) => item.title);
      addTitlesToTrie(titles);
      writeCachedTitles(queryInfo.trimmed, titles);

      const localTitles = trieRef.current.lookup(queryInfo.trimmed, 25);
      mergeAndSetSuggestions(queryInfo.trimmed, [localTitles, titles]);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while searching.";
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f6f1] px-4 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="sticky top-4 z-20 mb-8 rounded-3xl border border-[#d6e2d3] bg-[#f9fcf7]/95 p-4 shadow-[0_14px_30px_rgba(25,56,38,0.10)] backdrop-blur-sm sm:p-5">
          <div className="grid items-start gap-3 lg:grid-cols-[auto_1fr_auto]">
            <h1 className="px-2 font-mono text-3xl font-semibold tracking-[-0.03em] text-[#183429]">
              MangAI
            </h1>

            <div>
              <form onSubmit={handleSubmitSearch} className="relative">
                <label className="flex h-12 items-center rounded-full border border-[#cfddca] bg-white px-4 shadow-[0_5px_14px_rgba(30,65,46,0.08)]">
                  <span className="mr-3 text-sm text-[#6c8374]">Search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => handleInputChange(event.target.value)}
                    placeholder="Find manga titles"
                    className="h-full w-full bg-transparent text-sm text-[#1c352a] outline-none placeholder:text-[#9aac9f]"
                  />
                  <button
                    type="submit"
                    disabled={!queryInfo.canSearch || loading}
                    className="ml-2 rounded-full bg-[#a5e37d] px-4 py-1 text-xs font-semibold text-[#1e3d30] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Searching" : "Search"}
                  </button>
                </label>

                {suggestions.length > 0 && queryInfo.canSearch && (
                  <ul className="absolute left-0 right-0 top-14 z-30 rounded-2xl border border-[#d4e1d1] bg-white p-2 shadow-[0_12px_24px_rgba(27,60,41,0.14)]">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionPick(suggestion)}
                          className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#294637] transition hover:bg-[#eef7ea]"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/protected"
                className="rounded-full border border-[#c9d8c7] bg-white px-4 py-2 text-sm font-semibold text-[#2a4a38] transition hover:bg-[#eff8eb]"
              >
                Protected
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-[#a5e37d] px-4 py-2 text-sm font-semibold text-[#1e3d30] transition hover:bg-[#94d66f]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-3xl border border-[#d6e2d3] bg-[#f9fcf7] p-5 shadow-[0_12px_26px_rgba(25,56,38,0.08)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#173328]">Search results</h2>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60786a]">
                Signed in as {userEmail}
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-2xl border border-[#ebc2cd] bg-[#fff4f7] px-4 py-3 text-sm text-[#a03e60]">
                Search failed: {error}
              </p>
            )}

            {!error && hasSearched && results.length === 0 && (
              <p className="rounded-2xl border border-[#d7e3d4] bg-white px-4 py-3 text-sm text-[#5f7769]">
                No manga titles matched your search.
              </p>
            )}

            {!hasSearched && (
              <p className="rounded-2xl border border-[#d7e3d4] bg-white px-4 py-3 text-sm text-[#5f7769]">
                Type at least 2 characters for autocomplete. Press Search to fetch and display a full result list.
              </p>
            )}

            {results.length > 0 && (
              <ul className="space-y-3">
                {results.map((result) => (
                  <li
                    key={result.id}
                    className="rounded-2xl border border-[#d7e3d4] bg-white p-4"
                  >
                    <h3 className="text-lg font-semibold text-[#1f382d]">{result.title}</h3>
                    <p className="mt-1 text-sm text-[#6a8173]">
                      {result.type ? `${result.type} · ` : ""}
                      {result.year ? `Year ${result.year}` : "Year unknown"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-[#d6e2d3] bg-white p-5 shadow-[0_12px_26px_rgba(25,56,38,0.08)] sm:p-6">
              <h3 className="text-lg font-semibold text-[#173328]">Search tips</h3>
              <p className="mt-2 text-sm text-[#647d6e]">
                Use full or partial titles, then pick a suggestion or submit to refresh results from MangaUpdates.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
