const crypto = require('crypto');
const config = require('../../config');
const { BaseService } = require('../../core/BaseService');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/catalog');

class SearchService extends BaseService {
  constructor({ productService, categoryRepository, cacheService }) {
    super();
    this.productService = productService;
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
  }

  _searchCacheKey(query, pagination) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ query, page: pagination.page, limit: pagination.limit }))
      .digest('hex')
      .slice(0, 16);
    return CACHE_KEYS.searchResults(hash);
  }

  async searchProducts(query = {}) {
    const pagination = parsePagination(query);
    const term = String(query.q || query.search || '').trim();

    if (!term) {
      return { items: [], meta: buildPaginationMeta(pagination.page, pagination.limit, 0) };
    }

    const cacheKey = this._searchCacheKey(term.toLowerCase(), pagination);
    const ttl = config.cache?.searchTtlSeconds || CACHE_TTL.SEARCH_RESULTS;

    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    const result = await this.productService.searchPublic({
      ...query,
      q: term,
      page: pagination.page,
      limit: pagination.limit,
    });

    const payload = {
      items: result.items,
      meta: result.meta,
      query: term,
    };

    if (this.cacheService) {
      await this.cacheService.set(cacheKey, payload, ttl);
    }

    return payload;
  }
}

module.exports = { SearchService };
