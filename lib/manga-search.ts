/**
 * Manga Search Service
 * Provides search functionality using MangaDex as primary API
 * with MangaUpdates as fallback and metadata hydration
 */

export interface MangaSearchResult {
  id: string;
  title: string;
  description?: string;
  cover?: string;
  status?: string;
  year?: number;
  rating?: number;
  source: 'mangadex' | 'mangaupdates';
}

export interface SearchResponse {
  data: MangaSearchResult[];
  total: number;
  limit: number;
  offset: number;
}

// MangaDex API types
export interface MangaDexMangaAttributes {
  title: Record<string, string>;
  description?: Record<string, string>;
  status?: string;
  year?: number;
  contentRating?: string;
  lastVolume?: string;
  lastChapter?: string;
}

export interface MangaDexManga {
  id: string;
  type: string;
  attributes: MangaDexMangaAttributes;
  relationships?: Array<{
    id: string;
    type: string;
  }>;
}

export interface MangaDexSearchResponse {
  result: string;
  response: string;
  data: MangaDexManga[];
  limit: number;
  offset: number;
  total: number;
}

// MangaUpdates API types
export interface MangaUpdatesSearchResult {
  series_id: number;
  title: string;
  year?: number;
  description?: string;
  status?: string;
}

export interface MangaUpdatesSearchResponse {
  total_hits: number;
  per_page: number;
  page: number;
  results: Array<{
    record: MangaUpdatesSearchResult;
  }>;
}

const MANGADEX_API = 'https://api.mangadex.org';
const MANGAUPDATES_API = 'https://api.mangaupdates.com/v1';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

/**
 * Custom error class for search service
 */
export class MangaSearchError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'MangaSearchError';
  }
}

/**
 * Validates search query string
 */
export function validateSearchQuery(query: string): { valid: true } | { valid: false; error: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Search query must be a non-empty string' };
  }

  if (query.trim().length === 0) {
    return { valid: false, error: 'Search query cannot be empty or whitespace only' };
  }

  if (query.length > 200) {
    return { valid: false, error: 'Search query cannot exceed 200 characters' };
  }

  return { valid: true };
}

/**
 * Searches MangaDex API as primary source
 */
export async function searchMangaDex(
  query: string,
  limit: number = DEFAULT_LIMIT,
  offset: number = DEFAULT_OFFSET,
): Promise<SearchResponse> {
  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    throw new MangaSearchError('INVALID_QUERY', validation.error, 400);
  }

  try {
    const params = new URLSearchParams({
      title: query,
      limit: Math.min(limit, 100).toString(),
      offset: Math.max(0, offset).toString(),
      'order[relevance]': 'desc',
      'contentRating[]': 'safe',
      'contentRating[]': 'suggestive',
      'contentRating[]': 'erotica',
    });

    const url = `${MANGADEX_API}/manga?${params}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new MangaSearchError(
        'MANGADEX_API_ERROR',
        `MangaDex API returned status ${response.status}`,
        response.status,
      );
    }

    const data: MangaDexSearchResponse = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new MangaSearchError(
        'INVALID_RESPONSE',
        'Invalid MangaDex API response format',
        500,
      );
    }

    const results: MangaSearchResult[] = data.data.map((manga) => ({
      id: manga.id,
      title: manga.attributes.title?.en || Object.values(manga.attributes.title)?.[0] || 'Unknown',
      description: manga.attributes.description?.en,
      status: manga.attributes.status,
      year: manga.attributes.year,
      source: 'mangadex' as const,
    }));

    return {
      data: results,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  } catch (error) {
    if (error instanceof MangaSearchError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new MangaSearchError(
        'MANGADEX_FETCH_ERROR',
        `Failed to reach MangaDex API: ${error.message}`,
        502,
        error,
      );
    }

    throw new MangaSearchError(
      'MANGADEX_UNKNOWN_ERROR',
      'Unknown error occurred while searching MangaDex',
      500,
    );
  }
}

/**
 * Searches MangaUpdates API as fallback/hydration source
 */
export async function searchMangaUpdates(
  query: string,
  limit: number = DEFAULT_LIMIT,
  offset: number = DEFAULT_OFFSET,
): Promise<SearchResponse> {
  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    throw new MangaSearchError('INVALID_QUERY', validation.error, 400);
  }

  try {
    const page = Math.floor(offset / limit) + 1;
    const body = {
      search: query.trim(),
      stype: 'title',
      page,
      perpage: Math.min(limit, 100),
    };

    const response = await fetch(`${MANGAUPDATES_API}/series/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new MangaSearchError(
        'MANGAUPDATES_API_ERROR',
        `MangaUpdates API returned status ${response.status}`,
        response.status,
      );
    }

    const data: MangaUpdatesSearchResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new MangaSearchError(
        'INVALID_RESPONSE',
        'Invalid MangaUpdates API response format',
        500,
      );
    }

    const results: MangaSearchResult[] = data.results.map((item) => ({
      id: item.record.series_id.toString(),
      title: item.record.title,
      description: item.record.description,
      status: item.record.status,
      year: item.record.year,
      source: 'mangaupdates' as const,
    }));

    return {
      data: results,
      total: data.total_hits,
      limit: data.per_page,
      offset: (data.page - 1) * data.per_page,
    };
  } catch (error) {
    if (error instanceof MangaSearchError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new MangaSearchError(
        'MANGAUPDATES_FETCH_ERROR',
        `Failed to reach MangaUpdates API: ${error.message}`,
        502,
        error,
      );
    }

    throw new MangaSearchError(
      'MANGAUPDATES_UNKNOWN_ERROR',
      'Unknown error occurred while searching MangaUpdates',
      500,
    );
  }
}

/**
 * Search with MangaDex as primary, falls back to MangaUpdates if primary fails
 * Can optionally hydrate results with metadata from other source
 */
export async function searchManga(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    fallbackToMangaUpdates?: boolean;
    hydrateFromMangaUpdates?: boolean;
  } = {},
): Promise<SearchResponse> {
  const {
    limit = DEFAULT_LIMIT,
    offset = DEFAULT_OFFSET,
    fallbackToMangaUpdates = true,
    hydrateFromMangaUpdates = false,
  } = options;

  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    throw new MangaSearchError('INVALID_QUERY', validation.error, 400);
  }

  // Try MangaDex first
  try {
    const result = await searchMangaDex(query, limit, offset);

    // Optionally hydrate with MangaUpdates metadata
    if (hydrateFromMangaUpdates && result.data.length > 0) {
      try {
        const updatesResult = await searchMangaUpdates(query, 5, 0);
        // Could merge metadata here if needed
        // For now, just return MangaDex results
      } catch (hydrationError) {
        // Hydration failure is non-critical, continue with MangaDex results
        console.warn('Failed to hydrate MangaDex results with MangaUpdates metadata:', hydrationError);
      }
    }

    return result;
  } catch (mangadexError) {
    if (!fallbackToMangaUpdates) {
      throw mangadexError;
    }

    console.warn('MangaDex search failed, falling back to MangaUpdates:', mangadexError);

    // Fall back to MangaUpdates
    try {
      return await searchMangaUpdates(query, limit, offset);
    } catch (mangaupdatesError) {
      // Both failed, throw from MangaUpdates
      throw mangaupdatesError;
    }
  }
}
