# Manga Search System - File Index

## 📂 Overview
Complete implementation of an expanded manga search system with MangaDex as primary API, MangaUpdates as fallback, comprehensive error handling, and unit tests.

---

## 📄 Documentation Files (Start Here)

| File | Purpose | Read Time |
|------|---------|-----------|
| [MANGA_SEARCH_QUICK_START.md](./MANGA_SEARCH_QUICK_START.md) | Quick setup and usage guide | 5 min |
| [MANGA_SEARCH_API.md](./MANGA_SEARCH_API.md) | Complete API documentation | 15 min |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Technical implementation details | 10 min |

---

## 🔧 Core Implementation Files

### Service Layer
- **lib/manga-search.ts** (420 lines)
  - Main search service with MangaDex + MangaUpdates integration
  - `searchMangaDex()` - MangaDex search
  - `searchMangaUpdates()` - MangaUpdates search
  - `searchManga()` - Unified search with fallback
  - `validateSearchQuery()` - Input validation
  - `MangaSearchError` - Custom error class
  - Full TypeScript type definitions

### API Routes
- **app/api/search/route.ts** (167 lines)
  - Primary unified search endpoint
  - GET: `/api/search?q=query&limit=10&offset=0`
  - POST: `/api/search` with JSON body
  - Supports fallback and hydration options

- **app/api/mangadex/search/route.ts** (110 lines)
  - MangaDex-only endpoint (no fallback)
  - GET: `/api/mangadex/search?q=query`
  - POST: `/api/mangadex/search` with JSON body

### Configuration
- **jest.config.js** (22 lines)
  - Jest configuration for Next.js
  - Path aliases and test environment setup

- **jest.setup.js** (2 lines)
  - Jest lifecycle setup

- **package.json** (Updated)
  - Added test scripts: `test`, `test:watch`, `test:coverage`
  - Added dev dependencies: jest, ts-jest, @testing-library/react, etc.

---

## 🧪 Test Files

| File | Coverage | Tests |
|------|----------|-------|
| lib/manga-search.test.ts | Service layer (validation, both APIs, fallback, errors) | 30+ |
| app/api/search/route.test.ts | Unified endpoint (GET/POST, parameters, validation, errors) | 20+ |
| app/api/mangadex/search/route.test.ts | MangaDex endpoint (GET/POST, validation, constraints) | 25+ |

**Total**: 75+ test cases

---

## 📚 Usage Quick Reference

### Installation
```bash
npm install
npm test  # Run tests to verify
npm run dev  # Start dev server
```

### Search
```bash
# GET request
curl "http://localhost:3000/api/search?q=One%20Piece"

# POST request
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Naruto"}'
```

### Response Format
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string?",
      "status": "string?",
      "year": "number?",
      "source": "mangadex" | "mangaupdates"
    }
  ],
  "total": number,
  "limit": number,
  "offset": number
}
```

---

## 🎯 Key Features

✅ **MangaDex Priority** - Beautiful search functionality, first choice
✅ **MangaUpdates Fallback** - Larger repository as backup
✅ **Error Handling** - Structured errors with codes and messages
✅ **Input Validation** - Query length, type checking, bounds validation
✅ **Pagination** - Configurable limit and offset with constraints
✅ **Type Safety** - Full TypeScript support with exported types
✅ **Unit Tests** - 75+ test cases covering all paths
✅ **Documentation** - Complete API docs + quick start guide
✅ **Response Consistency** - Same format from all sources
✅ **Source Tracking** - Know which API provided each result

---

## 🏗️ Architecture

### Data Flow
```
Request
  ↓
Validate Query
  ↓
Try MangaDex
  ├─ Success → Return
  │
  └─ Failure (if fallback enabled)
      └─ Try MangaUpdates
          ├─ Success → Return
          └─ Failure → Return Error
```

### Error Handling
- `MangaSearchError` - Custom error with code, message, statusCode
- Structured error responses with HTTP status codes
- Clear error messages for debugging
- Original errors attached for investigation

---

## 📊 Test Coverage

**Service Layer** (`lib/manga-search.test.ts`)
- Input validation (valid/empty/long queries)
- MangaDex API success/failure
- MangaUpdates API success/failure
- Unified search with fallback
- Error handling and propagation
- Edge cases (non-English titles, special characters)
- Pagination constraints and limits

**API Routes** (`app/api/*/route.test.ts`)
- GET request parameter parsing
- POST request body parsing
- Parameter validation and constraints
- Limit capping and offset validation
- Error propagation from service
- Invalid input rejection
- HTTP status code verification

---

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🔗 Related Files (Not Modified)

- `app/api/mangaupdates/search/route.ts` - Original MangaUpdates endpoint (preserved)
- All authentication and UI files remain unchanged

---

## 📖 Documentation Navigation

Start with one of these based on your role:

**I want to use the API**
→ Read [MANGA_SEARCH_QUICK_START.md](./MANGA_SEARCH_QUICK_START.md)

**I need complete API reference**
→ Read [MANGA_SEARCH_API.md](./MANGA_SEARCH_API.md)

**I want technical implementation details**
→ Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**I want to integrate it in my code**
→ Read [MANGA_SEARCH_QUICK_START.md](./MANGA_SEARCH_QUICK_START.md#quick-usage) + [MANGA_SEARCH_API.md](./MANGA_SEARCH_API.md#javascript-example)

**I want to run tests**
→ Run `npm test` and check test files in `lib/` and `app/api/`

---

## ✅ Implementation Checklist

- ✅ MangaDex API integration
- ✅ MangaUpdates fallback system
- ✅ Unified search endpoint
- ✅ Direct MangaDex endpoint
- ✅ Error handling with custom error class
- ✅ Input validation (query, pagination)
- ✅ TypeScript type definitions
- ✅ Jest setup and configuration
- ✅ Service layer tests (30+ cases)
- ✅ API route tests (45+ cases)
- ✅ API documentation with examples
- ✅ Quick start guide
- ✅ Implementation summary
- ✅ File index (this document)

---

## 🔄 Next Steps

1. **Test the implementation**
   ```bash
   npm test
   ```

2. **Try the API**
   ```bash
   npm run dev
   curl "http://localhost:3000/api/search?q=One%20Piece"
   ```

3. **Integrate into UI**
   - Use the examples in MANGA_SEARCH_API.md
   - Import types from lib/manga-search.ts
   - Handle error codes defined in docs

4. **Monitor performance**
   - Consider caching results
   - Track which API is used (watch source field)
   - Monitor error rates

---

## 🎓 Learning Resources

- [MangaDex API Docs](https://api.mangadex.org/docs/)
- [MangaUpdates API](https://api.mangaupdates.com/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: March 2026  
**Test Coverage**: 75+ test cases  
**Documentation**: Complete
