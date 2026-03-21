# Manga Search API - Quick Start Guide

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run tests** to verify everything works:
   ```bash
   npm test
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

---

## File Structure

### New Files Created

```
lib/
  └─ manga-search.ts              # Core search service with MangaDex + MangaUpdates
  └─ manga-search.test.ts         # Service layer tests

app/api/
  ├─ search/
  │  ├─ route.ts                  # Unified search endpoint (primary)
  │  └─ route.test.ts             # Unified endpoint tests
  │
  └─ mangadex/search/
     ├─ route.ts                  # MangaDex-only endpoint
     └─ route.test.ts             # MangaDex endpoint tests

MANGA_SEARCH_API.md               # Complete API documentation
MANGA_SEARCH_QUICK_START.md       # This file
```

---

## Quick Usage

### Using the Unified Search Endpoint

This is the recommended endpoint - it uses MangaDex as primary with MangaUpdates fallback.

**GET Request**:
```bash
curl "http://localhost:3000/api/search?q=One%20Piece&limit=10"
```

**POST Request**:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Naruto", "limit": 10}'
```

### Using MangaDex-Only Endpoint

For direct MangaDex access (no fallback):

```bash
curl "http://localhost:3000/api/mangadex/search?q=Tokyo%20Ghoul"
```

---

## API Response Example

```json
{
  "data": [
    {
      "id": "a1d0fa8b-4f7f-404f-bfb6-f6635f8d0d2f",
      "title": "One Piece",
      "description": "As a child, Luffy was inspired...",
      "status": "ongoing",
      "year": 1997,
      "source": "mangadex"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- ✅ Input validation (empty/invalid queries)
- ✅ MangaDex API integration
- ✅ MangaUpdates API integration
- ✅ Fallback behavior
- ✅ Error handling (502, 500, 400 status codes)
- ✅ Pagination (limit, offset constraints)
- ✅ Response formatting
- ✅ Edge cases (special characters, non-English titles)

---

## Service Methods

### In Your Code

Use the service directly in server-side code:

```typescript
import { searchManga, searchMangaDex, MangaSearchError } from '@/lib/manga-search';

// Try both APIs with fallback
try {
  const results = await searchManga('Naruto', {
    limit: 20,
    offset: 0,
    fallbackToMangaUpdates: true,
  });
  console.log(`Found ${results.total} results`);
} catch (error) {
  if (error instanceof MangaSearchError) {
    console.error(`Search failed: ${error.code} - ${error.message}`);
  }
}

// Use only MangaDex
try {
  const results = await searchMangaDex('One Piece', 10, 0);
  console.log(results.data);
} catch (error) {
  console.error('MangaDex error:', error);
}
```

---

## Error Handling

Common error codes:

| Code | Status | Meaning | Solution |
|------|--------|---------|----------|
| `INVALID_QUERY` | 400 | Empty or invalid search | Validate input before search |
| `MANGADEX_FETCH_ERROR` | 502 | MangaDex unreachable | Check api.mangadex.org or retry |
| `MANGAUPDATES_FETCH_ERROR` | 502 | Both APIs down | Retry later |
| `INVALID_RESPONSE` | 500 | Bad API response | Retry, check API status |

---

## Advanced Features

### Pagination

```bash
# Page 1
curl "http://localhost:3000/api/search?q=test&limit=10&offset=0"

# Page 2
curl "http://localhost:3000/api/search?q=test&limit=10&offset=10"

# Page 3
curl "http://localhost:3000/api/search?q=test&limit=10&offset=20"
```

### Disable Fallback

Force MangaDex-only (or fail if unavailable):

```bash
curl "http://localhost:3000/api/search?q=test&fallback=false"
```

### Request Both APIs

Hydrate MangaDex results with MangaUpdates metadata:

```bash
curl "http://localhost:3000/api/search?q=test&hydrate=true"
```

---

## Architecture Overview

### Search Flow

1. **Client Request** → `/api/search?q=query`
2. **Validation** → Check query length, format
3. **MangaDex Call** → Primary search
4. **Success?** → Return formatted results
5. **Failure?** → Fallback to MangaUpdates (if enabled)
6. **Response** → Format and return results

### Source Detection

Results include a `source` field showing which API provided the result:
- `"source": "mangadex"` - From MangaDex API
- `"source": "mangaupdates"` - From MangaUpdates (fallback)

This lets you distinguish which API was used for each result.

---

## Performance Tips

1. **Cache results** client-side (5-60 minutes)
2. **Limit result count** - use 10-20 per page
3. **Trust the fallback** - don't hammer primary only
4. **Paginate efficiently** - load results as needed
5. **Keep queries short** - best results with <50 chars

---

## Troubleshooting

### Tests failing?

1. Clear jest cache: `npx jest --clearCache`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (should be 16+)

### API returning errors?

1. Check network: `curl https://api.mangadex.org/manga?title=test`
2. Ensure valid query: 1-200 characters
3. Check MangaDex status: https://api.mangadex.org/

### TypeScript errors?

1. Generate types: `npm run build`
2. Check tsconfig.json paths are correct
3. Reinstall @types packages: `npm install --save-dev @types/node @types/react`

---

## Next Steps

- Integrate search into home page UI
- Add caching layer for frequently searched titles
- Implement advanced filtering options
- Add search history/suggestions
- Monitor API performance and error rates

---

## Support

For issues or questions about the API:

1. Check [MANGA_SEARCH_API.md](./MANGA_SEARCH_API.md) for full documentation
2. Review test files for usage examples
3. Check error codes and solutions above
