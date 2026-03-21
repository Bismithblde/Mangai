# Manga Search API Documentation

## Overview

The Manga Search API provides a unified interface for searching manga across two sources:
- **MangaDex** (primary): Better search functionality and up-to-date metadata
- **MangaUpdates** (fallback/hydration): Larger repository and additional metadata

The system automatically falls back to MangaUpdates if MangaDex fails, and can optionally hydrate results with metadata from both sources.

## API Endpoints

### 1. Unified Search Endpoint

**Endpoint**: `GET /api/search` or `POST /api/search`

The primary endpoint for manga searches. Uses MangaDex as the primary source with automatic fallback to MangaUpdates.

#### GET Request

```bash
GET /api/search?q=One%20Piece&limit=10&offset=0
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q`, `query`, or `title` | string | Yes | - | Search term (1-200 characters) |
| `limit` | number | No | 10 | Results per page (1-100) |
| `offset` | number | No | 0 | Pagination offset (≥ 0) |
| `fallback` | boolean | No | true | Use MangaUpdates fallback when MangaDex fails |
| `hydrate` | boolean | No | false | Hydrate with metadata from other source |

#### POST Request

```bash
POST /api/search
Content-Type: application/json

{
  "query": "One Piece",
  "limit": 10,
  "offset": 0,
  "fallbackToMangaUpdates": true,
  "hydrateFromMangaUpdates": false
}
```

**Request Body**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query`, `q`, or `title` | string | Yes | - | Search term (1-200 characters) |
| `limit` | number | No | 10 | Results per page (1-100) |
| `offset` | number | No | 0 | Pagination offset (≥ 0) |
| `fallbackToMangaUpdates` | boolean | No | true | Use fallback when primary fails |
| `hydrateFromMangaUpdates` | boolean | No | false | Hydrate with metadata |

#### Response

```json
{
  "data": [
    {
      "id": "manga-uuid-or-id",
      "title": "One Piece",
      "description": "A pirate adventure story",
      "status": "ongoing",
      "year": 1997,
      "rating": 8.5,
      "source": "mangadex"
    }
  ],
  "total": 127,
  "limit": 10,
  "offset": 0
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `data` | Array | Array of manga results |
| `data[].id` | string | Unique manga identifier |
| `data[].title` | string | Manga title |
| `data[].description` | string | Long-form description (optional) |
| `data[].status` | string | Publication status (e.g., "ongoing", "completed") |
| `data[].year` | number | Publication year |
| `data[].rating` | number | Community rating (optional) |
| `data[].source` | "mangadex" \| "mangaupdates" | Which API provided this result |
| `total` | number | Total matching results |
| `limit` | number | Results per page |
| `offset` | number | Current pagination offset |

#### Error Responses

```json
{
  "error": "Search query cannot be empty or whitespace only",
  "code": "INVALID_QUERY"
}
```

**Common Errors**:
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_QUERY` | Missing or invalid search query |
| 400 | `INVALID_REQUEST` | Invalid request parameters |
| 502 | `MANGADEX_FETCH_ERROR` | MangaDex API unreachable |
| 502 | `MANGAUPDATES_FETCH_ERROR` | Both APIs unreachable |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

#### Examples

**Basic Search**:
```bash
curl "http://localhost:3000/api/search?q=Naruto"
```

**Paginated Search**:
```bash
curl "http://localhost:3000/api/search?q=Tokyo&limit=20&offset=40"
```

**Without Fallback**:
```bash
curl "http://localhost:3000/api/search?q=Jujutsu&fallback=false"
```

**POST with Full Options**:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Attack on Titan",
    "limit": 15,
    "offset": 0,
    "fallbackToMangaUpdates": true,
    "hydrateFromMangaUpdates": true
  }'
```

---

### 2. MangaDex-Only Search Endpoint

**Endpoint**: `GET /api/mangadex/search` or `POST /api/mangadex/search`

Search MangaDex directly without fallback to MangaUpdates. Useful when you specifically want MangaDex results only.

#### GET Request

```bash
GET /api/mangadex/search?q=One%20Piece&limit=10
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q`, `query`, or `title` | string | Yes | - | Search term (1-200 characters) |
| `limit` | number | No | 10 | Results per page (1-100) |
| `offset` | number | No | 0 | Pagination offset (≥ 0) |

#### POST Request

```bash
POST /api/mangadex/search
Content-Type: application/json

{
  "query": "One Piece",
  "limit": 10,
  "offset": 0
}
```

**Response**: Same format as unified search endpoint, but always includes `"source": "mangadex"`

#### Error Handling

```json
{
  "error": "MangaDex API returned status 503",
  "code": "MANGADEX_API_ERROR"
}
```

---

### 3. MangaUpdates Search Endpoint

**Endpoint**: `POST /api/mangaupdates/search`

The original MangaUpdates search endpoint. Supports advanced filtering options.

[Existing documentation applies - see route.ts for full parameter list]

---

## Error Handling

The API implements comprehensive error handling:

### Error Classes

**MangaSearchError**: Custom error class with structured information
```typescript
{
  code: string;        // Machine-readable error code
  message: string;     // Human-readable error message
  statusCode: number;  // HTTP status code
  originalError?: Error; // Original underlying error
}
```

### Error Scenarios

| Scenario | Status | Code | Handling |
|----------|--------|------|----------|
| Empty/missing query | 400 | `INVALID_QUERY` | Validate before sending |
| Query > 200 chars | 400 | `INVALID_QUERY` | Truncate or simplify query |
| MangaDex timeout | 502 | `MANGADEX_FETCH_ERROR` | Retry or use fallback |
| Invalid JSON | 400 | Invalid JSON body | Check request formatting |
| No fallback + primary fails | 502 | `MANGADEX_FETCH_ERROR` | Enable fallback or retry |
| Both APIs fail | 502 | `MANGAUPDATES_FETCH_ERROR` | Check API status and retry |

---

## Response Format

### Success Response

```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string (optional)",
      "status": "string (optional)",
      "year": "number (optional)",
      "rating": "number (optional)",
      "source": "mangadex" | "mangaupdates"
    }
  ],
  "total": number,
  "limit": number,
  "offset": number
}
```

### Error Response

```json
{
  "error": "string",
  "code": "string (optional)"
}
```

---

## Search Query Guidelines

- **Min length**: 1 character
- **Max length**: 200 characters
- **Allowed characters**: Any Unicode characters
- **Whitespace**: Leading/trailing whitespace is trimmed
- **Special characters**: Supported (', -, etc.)

**Good queries**:
- "One Piece"
- "進撃の巨人" (Attack on Titan in Japanese)
- "manhwa"
- "romance fantasy"

---

## Pagination

- **`limit`**: Results per page (1-100, capped automatically)
- **`offset`**: Zero-based offset (0, 10, 20, 30, ...)
- **MangaUpdates** converts offset to page numbers internally

**Example pagination flow**:
```
First page:  /api/search?q=test&limit=10&offset=0
Second page: /api/search?q=test&limit=10&offset=10
Third page:  /api/search?q=test&limit=10&offset=20
```

---

## Performance & Caching

- **Cache**: Disabled for fresh results (`cache: 'no-store'`)
- **Timeout**: Follows Node.js defaults (1-2 minutes)
- **Rate limiting**: None enforced by this API (respect upstream API limits)

---

## Source Priority

### Unified Search (`/api/search`)

**Primary Flow**:
1. Try MangaDex
2. If live data returned, use it
3. If MangaDex fails AND `fallbackToMangaUpdates=true`, try MangaUpdates
4. If both fail, return error

**Hydration Flow** (when `hydrateFromMangaUpdates=true`):
1. Search MangaDex (primary)
2. If successful AND hydration enabled, attempt to fetch additional metadata from MangaUpdates
3. Return merged data (non-critical failures ignored)

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Basic search
const response = await fetch('/api/search?q=Naruto');
const data = await response.json();

if (!response.ok) {
  console.error('Search failed:', data.error);
  return;
}

console.log(`Found ${data.total} results`);
data.data.forEach(manga => {
  console.log(`${manga.title} (${manga.source})`);
});
```

### TypeScript with Types

```typescript
import { SearchResponse, MangaSearchResult } from '@/lib/manga-search';

async function searchManga(query: string): Promise<MangaSearchResult[]> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data: SearchResponse = await response.json();
  return data.data;
}
```

### React Component

```jsx
import { useState, useEffect } from 'react';
import { SearchResponse } from '@/lib/manga-search';

export function MangaSearch({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: SearchResponse) => setResults(data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <div>Searching...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!results.length) return <div>No results</div>;

  return (
    <ul>
      {results.map(manga => (
        <li key={`${manga.source}-${manga.id}`}>
          <strong>{manga.title}</strong> ({manga.source})
          {manga.description && <p>{manga.description}</p>}
        </li>
      ))}
    </ul>
  );
}
```

---

## Testing

Run unit tests:

```bash
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

Test files:
- `lib/manga-search.test.ts` - Service layer tests
- `app/api/search/route.test.ts` - Unified endpoint tests
- `app/api/mangadex/search/route.test.ts` - MangaDex endpoint tests

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 error with empty query | User submitted empty search | Validate input on client side |
| 502 MANGADEX_FETCH_ERROR | MangaDex API down | Check api.mangadex.org or retry |
| No fallback results | User set fallback=false | Enable fallback or check MangaUpdates |
| Slow response | Network or API latency | Consider caching results client-side |
| Different results on retry | Fallback used different API | Check `source` field in response |

---

## API Limits & Best Practices

- **Query length**: Keep under 50 characters for best accuracy
- **Limit size**: Use 10-20 for good balance of results/performance
- **Pagination**: Implement efficiently (don't load all pages)
- **Caching**: Cache results on client 5-60 minutes
- **Error handling**: Always handle 502/500 gracefully with retry logic

---

## Implementation Details

### Search Service Architecture

```
┌─────────────────────────────────────┐
│  API Routes (/api/search, etc)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  searchManga() [lib/manga-search]   │
│  - Validates query                  │
│  - Tries MangaDex first             │
│  - Falls back to MangaUpdates       │
│  - Optionally hydrates metadata     │
└──────────────┬────────────────┬─────┘
               │                │
        ┌──────▼──────┐  ┌─────▼──────┐
        │searchMangaDex│  │searchManga │
        │              │  │Updates     │
        └──────────────┘  └────────────┘
               │                │
        ┌──────▼──────┐  ┌─────▼──────┐
        │MangaDex API │  │MangaUpdates│
        │             │  │API         │
        └──────────────┘  └────────────┘
```

### Error Flow

```
Try MangaDex
    │
    ├─ Success ──┐
    │            └─> Format ──> Return
    │
    └─ Failure
         │
         ├─ fallbackToMangaUpdates=false ──> Return Error
         │
         └─ fallbackToMangaUpdates=true
              │
              └─> Try MangaUpdates
                   │
                   ├─ Success ──> Format ──> Return
                   │
                   └─ Failure ──> Return Error
```
