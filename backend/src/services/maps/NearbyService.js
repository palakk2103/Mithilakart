const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { resolveTabFromQuery } = require('../../utils/marketplaceTab');

class NearbyService extends BaseService {
  constructor({ sellerRepository, productRepository, marketplaceListingRepository, geocodingService }) {
    super();
    this.sellerRepository = sellerRepository;
    this.productRepository = productRepository;
    this.marketplaceListingRepository = marketplaceListingRepository;
    this.geocodingService = geocodingService;
  }

  _parseCoords(query) {
    const latitude = Number(query.lat ?? query.latitude);
    const longitude = Number(query.lng ?? query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw AppError.validation('lat and lng query parameters are required');
    }
    return {
      latitude,
      longitude,
      radiusKm: Math.min(Math.max(Number(query.radiusKm) || 25, 1), 100),
    };
  }

  async reverseGeocode(query) {
    try {
      const { latitude, longitude } = this._parseCoords(query);
      const result = await this.geocodingService.reverseGeocode({ latitude, longitude });
      return result || this._coordFallback(latitude, longitude);
    } catch (error) {
      const latitude = Number(query.lat ?? query.latitude);
      const longitude = Number(query.lng ?? query.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return this._coordFallback(latitude, longitude);
      }
      throw error;
    }
  }

  _coordFallback(latitude, longitude) {
    return {
      latitude,
      longitude,
      shortLabel: `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      formattedAddress: `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      fullFormattedAddress: null,
      city: null,
      state: null,
      pincode: null,
      addressLine: null,
      placeId: null,
    };
  }

  async geocodeAddress(body) {
    const result = await this.geocodingService.geocodeAddress(body);
    if (!result) {
      throw AppError.validation('Could not geocode the provided address');
    }
    return result;
  }

  async nearbySellers(query) {
    const coords = this._parseCoords(query);
    const sellers = await this.sellerRepository.findNearby(coords);
    return sellers.map((seller) => ({
      id: seller._id,
      name: seller.name,
      storeName: seller.storeName,
      city: seller.city,
      addressLine: seller.addressLine,
      latitude: seller.latitude,
      longitude: seller.longitude,
      distanceKm: Number(seller.distanceKm?.toFixed(2) || 0),
    }));
  }

  async nearbyProducts(query) {
    const coords = this._parseCoords(query);
    const pagination = parsePagination(query);
    const sellers = await this.sellerRepository.findNearby(coords);

    if (!sellers.length) {
      return {
        items: [],
        meta: buildPaginationMeta(pagination.page, pagination.limit, 0),
        location: coords,
        sellerCount: 0,
        deliverable: false,
        reason: 'no_nearby_sellers',
      };
    }

    const sellerIds = sellers.map((s) => s._id);
    const distanceBySeller = Object.fromEntries(
      sellers.map((s) => [String(s._id), s.distanceKm])
    );

    const tab = resolveTabFromQuery(query);
    if (tab && this.marketplaceListingRepository) {
      return this._nearbyListings({
        query,
        coords,
        pagination,
        sellerIds,
        distanceBySeller,
        tab,
      });
    }

    const filter = {
      sellerId: { $in: sellerIds },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    if (query.commerceFlow) {
      filter.commerceFlows = { $in: [query.commerceFlow] };
    }

    const [items, total] = await Promise.all([
      this.productRepository.findPublic(filter, {
        sort: { createdAt: -1 },
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productRepository.countPublic(filter),
    ]);

    const filteredItems = items.filter((item) => {
      const sellerDistance = distanceBySeller[String(item.sellerId)];
      if (sellerDistance == null) return false;
      const radius = Number(item.attributes?.serviceableRadius);
      if (Number.isFinite(radius) && radius > 0 && sellerDistance > radius) {
        return false;
      }
      return true;
    });

    return {
      items: filteredItems.map((item) => ({
        id: item._id,
        title: item.title,
        price: item.price,
        mrp: item.mrp,
        imageUrl: item.imageUrl,
        brand: item.brand,
        commerceFlows: item.commerceFlows,
        sellerId: item.sellerId,
        distanceKm: distanceBySeller[String(item.sellerId)] ?? null,
      })),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
      location: coords,
      sellerCount: sellerIds.length,
      deliverable: filteredItems.length > 0,
      reason: filteredItems.length ? null : 'no_products_in_range',
    };
  }

  async _nearbyListings({ query, coords, pagination, sellerIds, distanceBySeller, tab }) {
    const listingFilter = {
      marketplaceTab: tab,
      sellerId: { $in: sellerIds },
    };

    const [listings, total] = await Promise.all([
      this.marketplaceListingRepository.findPublic(listingFilter, {
        sort: { createdAt: -1 },
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.marketplaceListingRepository.countPublic(listingFilter),
    ]);

    const productIds = [...new Set(listings.map((l) => l.productId))];
    let products = productIds.length
      ? await this.productRepository.findPublic({ _id: { $in: productIds } })
      : [];
    if (query.categoryId) {
      products = products.filter((p) => String(p.categoryId) === String(query.categoryId));
    }
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const filteredItems = listings
      .map((listing) => {
        const product = productMap.get(String(listing.productId));
        if (!product) return null;
        const sellerDistance = distanceBySeller[String(listing.sellerId)];
        if (sellerDistance == null) return null;
        const radius = Number(product.attributes?.serviceableRadius);
        if (Number.isFinite(radius) && radius > 0 && sellerDistance > radius) {
          return null;
        }
        return {
          id: listing._id,
          listingId: String(listing._id),
          productId: String(product._id),
          title: product.title,
          price: listing.price,
          mrp: listing.mrp,
          imageUrl: product.images?.[0]?.url || product.imageUrl,
          brand: product.brand,
          marketplaceTab: tab,
          deliveryPromiseMinutes: listing.deliveryPromiseMinutes,
          sellerId: listing.sellerId,
          distanceKm: sellerDistance ?? null,
        };
      })
      .filter(Boolean);

    return {
      items: filteredItems,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
      location: coords,
      sellerCount: sellerIds.length,
      deliverable: filteredItems.length > 0,
      reason: filteredItems.length ? null : 'no_products_in_range',
    };
  }
}
module.exports = { NearbyService };
