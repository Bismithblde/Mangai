import { NextRequest, NextResponse } from 'next/server';
import { searchMangaDex, MangaSearchError, validateSearchQuery } from '@/lib/manga-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || searchParams.get('title');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

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

    // Perform search
    const result = await searchMangaDex(query!, limit, offset);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MangaSearchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      );
    }

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

    // Perform search
    const result = await searchMangaDex(query, limit, offset);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MangaSearchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
