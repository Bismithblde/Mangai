import {
  validateSearchQuery,
  searchMangaDex,
  searchMangaUpdates,
  searchManga,
  MangaSearchError,
} from '@/lib/manga-search';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe('Manga Search Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('validateSearchQuery', () => {
    it('should accept valid search queries', () => {
      const validQueries = [
        'One Piece',
        'Naruto',
        'Attack on Titan',
        'A',
        'Very Long Manga Title That Is Still Valid Because It Is Less Than Two Hundred Characters Which Is The Maximum Allowed Length For A Search Query',
      ];

      validQueries.forEach((query) => {
        const result = validateSearchQuery(query);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject empty or null queries', () => {
      const invalidQueries = ['', '  ', null, undefined];

      invalidQueries.forEach((query) => {
        const result = validateSearchQuery(query as any);
        expect(result.valid).toBe(false);
        expect(result).toHaveProperty('error');
      });
    });

    it('should reject queries longer than 200 characters', () => {
      const longQuery = 'A'.repeat(201);
      const result = validateSearchQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('200 characters');
    });

    it('should reject non-string queries', () => {
      const result = validateSearchQuery(123 as any);
      expect(result.valid).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('searchMangaDex', () => {
    it('should successfully search MangaDex and return formatted results', async () => {
      const mockResponse = {
        result: 'ok',
        response: 'collection',
        data: [
          {
            id: 'manga-id-1',
            type: 'manga',
            attributes: {
              title: { en: 'One Piece' },
              description: { en: 'A pirate adventure' },
              status: 'ongoing',
              year: 1997,
            },
          },
          {
            id: 'manga-id-2',
            type: 'manga',
            attributes: {
              title: { en: 'Naruto' },
              status: 'completed',
              year: 1999,
            },
          },
        ],
        limit: 10,
        offset: 0,
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await searchMangaDex('One Piece', 10, 0);

      expect(result).toEqual({
        data: [
          {
            id: 'manga-id-1',
            title: 'One Piece',
            description: 'A pirate adventure',
            status: 'ongoing',
            year: 1997,
            source: 'mangadex',
          },
          {
            id: 'manga-id-2',
            title: 'Naruto',
            description: undefined,
            status: 'completed',
            year: 1999,
            source: 'mangadex',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.mangadex.org/manga'),
        expect.any(Object),
      );
    });

    it('should throw error on invalid query', async () => {
      await expect(searchMangaDex('', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchMangaDex('One Piece', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should throw error on invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: 'invalid',
        }),
      });

      await expect(searchMangaDex('One Piece', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(searchMangaDex('One Piece', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should respect pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: [],
          limit: 20,
          offset: 50,
          total: 100,
        }),
      });

      await searchMangaDex('test', 20, 50);

      const callUrl = (mockFetch.mock.calls[0][0] as string);
      expect(callUrl).toContain('limit=20');
      expect(callUrl).toContain('offset=50');
    });

    it('should handle titles with only non-English representations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'manga-id-3',
              type: 'manga',
              attributes: {
                title: { ja: '鬼滅の刃', ko: '귀멸의 칼날' },
              },
            },
          ],
          limit: 10,
          offset: 0,
          total: 1,
        }),
      });

      const result = await searchMangaDex('Demon Slayer');

      expect(result.data[0].title).toBeDefined();
      expect(result.data[0].title).not.toBe('Unknown');
    });
  });

  describe('searchMangaUpdates', () => {
    it('should successfully search MangaUpdates and return formatted results', async () => {
      const mockResponse = {
        total_hits: 2,
        per_page: 10,
        page: 1,
        results: [
          {
            record: {
              series_id: 123,
              title: 'One Piece',
              year: 1997,
              description: 'A pirate adventure',
              status: 'ongoing',
            },
          },
          {
            record: {
              series_id: 456,
              title: 'Naruto',
              year: 1999,
              status: 'completed',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await searchMangaUpdates('One Piece', 10, 0);

      expect(result).toEqual({
        data: [
          {
            id: '123',
            title: 'One Piece',
            year: 1997,
            description: 'A pirate adventure',
            status: 'ongoing',
            source: 'mangaupdates',
          },
          {
            id: '456',
            title: 'Naruto',
            year: 1999,
            description: undefined,
            status: 'completed',
            source: 'mangaupdates',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mangaupdates.com/v1/series/search',
        expect.any(Object),
      );
    });

    it('should throw error on invalid query', async () => {
      await expect(searchMangaUpdates('', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchMangaUpdates('One Piece', 10, 0)).rejects.toThrow(MangaSearchError);
    });

    it('should convert offset to page number correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          total_hits: 0,
          per_page: 10,
          page: 3,
          results: [],
        }),
      });

      await searchMangaUpdates('test', 10, 20);

      const body = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(body.page).toBe(3);
    });
  });

  describe('searchManga (unified search)', () => {
    it('should use MangaDex as primary source', async () => {
      const mockMangaDexResponse = {
        result: 'ok',
        response: 'collection',
        data: [
          {
            id: 'manga-id-1',
            type: 'manga',
            attributes: {
              title: { en: 'One Piece' },
            },
          },
        ],
        limit: 10,
        offset: 0,
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockMangaDexResponse),
      });

      const result = await searchManga('One Piece');

      expect(result.data[0].source).toBe('mangadex');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.mangadex.org/manga'),
        expect.any(Object),
      );
    });

    it('should fallback to MangaUpdates when MangaDex fails', async () => {
      const mockMangaUpdatesResponse = {
        total_hits: 1,
        per_page: 10,
        page: 1,
        results: [
          {
            record: {
              series_id: 123,
              title: 'One Piece',
            },
          },
        ],
      };

      mockFetch
        .mockRejectedValueOnce(new Error('MangaDex API error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValueOnce(mockMangaUpdatesResponse),
        });

      const result = await searchManga('One Piece', { fallbackToMangaUpdates: true });

      expect(result.data[0].source).toBe('mangaupdates');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not fallback when fallbackToMangaUpdates is false', async () => {
      mockFetch.mockRejectedValueOnce(new Error('MangaDex API error'));

      await expect(
        searchManga('One Piece', { fallbackToMangaUpdates: false }),
      ).rejects.toThrow(MangaSearchError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when both APIs fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('MangaDex API error'))
        .mockRejectedValueOnce(new Error('MangaUpdates API error'));

      await expect(searchManga('One Piece')).rejects.toThrow(MangaSearchError);
    });

    it('should respect pagination options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: [],
          limit: 25,
          offset: 100,
          total: 0,
        }),
      });

      await searchManga('test', { limit: 25, offset: 100 });

      const callUrl = (mockFetch.mock.calls[0][0] as string);
      expect(callUrl).toContain('limit=25');
      expect(callUrl).toContain('offset=100');
    });
  });

  describe('MangaSearchError', () => {
    it('should create error with proper properties', () => {
      const error = new MangaSearchError('TEST_ERROR', 'Test message', 400);

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('MangaSearchError');
    });

    it('should attach original error', () => {
      const originalError = new Error('Original');
      const error = new MangaSearchError('TEST_ERROR', 'Wrapper', 500, originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('Edge cases and limits', () => {
    it('should cap limit to 100', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: [],
          limit: 100,
          offset: 0,
          total: 0,
        }),
      });

      await searchMangaDex('test', 500, 0);

      const callUrl = (mockFetch.mock.calls[0][0] as string);
      expect(callUrl).toContain('limit=100');
    });

    it('should not allow negative offset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({
          data: [],
          limit: 10,
          offset: 0,
          total: 0,
        }),
      });

      await searchMangaDex('test', 10, -50);

      const callUrl = (mockFetch.mock.calls[0][0] as string);
      expect(callUrl).toContain('offset=0');
    });
  });
});
