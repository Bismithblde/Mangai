import { NextRequest, NextResponse } from 'next/server';
import { searchManga, MangaSearchError, validateSearchQuery } from '@/lib/manga-search';

/**
 * Unified manga search endpoint
 * Uses MangaDex as primary API with automatic fallback to MangaUpdates
 * 
 * GET parameters:
 * - q, query, or title: Search term (required)
 * - limit: Results per page (1-100, default 10)
 * - offset: Pagination offset (default 0)
 * - fallback: Use MangaUpdates fallback (default true)
 * - hydrate: Hydrate MangaDex results with MangaUpdates metadata (default false)
 * 
 * POST body:
 * - query|q|title: Search term (required)
 * - limit: Results per page (1-100, default 10)
 * - offset: Pagination offset (default 0)
 * - fallbackToMangaUpdates: Use fallback (default true)
 * - hydrateFromMangaUpdates: Hydrate with metadata (default false)
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || searchParams.get('title');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const fallbackParam = searchParams.get('fallback');
    const hydrateParam = searchParams.get('hydrate');

    // Validate query
    const validation = validateSearchQuery(query ?? '');
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    // Parse pagination parameters
    const limit = Math.min(Math.max(1, parseInt(limitParam || '10')), 100);
    const offset = Math.max(0, parseInt(offsetParam || '0'));

    // Parse feature flags
    const fallbackToMangaUpdates = fallbackParam !== 'false';
    const hydrateFromMangaUpdates = hydrateParam === 'true';

    // Perform search
    const result = await searchManga(query!, {
      limit,
      offset,
      fallbackToMangaUpdates,
      hydrateFromMangaUpdates,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MangaSearchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      );
    }

    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query && !body.q && !body.title) {
      return NextResponse.json(
        { error: 'Missing required field: query, q, or title' },
        { status: 400 },
      );
    }

    const query = (body.query || body.q || body.title) as string;

    // Validate query
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    // Parse pagination parameters
    const limit = Math.min(Math.max(1, body.limit ?? 10), 100);
    const offset = Math.max(0, body.offset ?? 0);

    // Parse options
    const fallbackToMangaUpdates = body.fallbackToMangaUpdates !== false;
    const hydrateFromMangaUpdates = body.hydrateFromMangaUpdates === true;

    // Perform search
    const result = await searchManga(query, {
      limit,
      offset,
      fallbackToMangaUpdates,
      hydrateFromMangaUpdates,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MangaSearchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
