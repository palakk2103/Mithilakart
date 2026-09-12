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

  _calculateDeliveryEta(distanceKm) {
    if (distanceKm == null || !Number.isFinite(distanceKm)) {
      return { estimatedDeliveryMinutes: 30, deliveryEtaText: '30 mins' };
    }
    const dist = Number(distanceKm.toFixed(2));
    const travelMinutes = Math.round(dist / (25 / 60)); // 25 km/h avg speed
    const prepMinutes = 10;
    const bufferMinutes = 5;
    const estimatedDeliveryMinutes = Math.max(15, travelMinutes + prepMinutes + bufferMinutes);
    const deliveryEtaText = estimatedDeliveryMinutes <= 45
      ? `${estimatedDeliveryMinutes} mins`
      : `${(estimatedDeliveryMinutes / 60).toFixed(1)} hrs`;
    return { estimatedDeliveryMinutes, deliveryEtaText };
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
    const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));
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
        sellerMap,
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
      items: filteredItems.map((item) => {
        const seller = sellerMap.get(String(item.sellerId));
        const sellerDistance = distanceBySeller[String(item.sellerId)] ?? null;
        const eta = this._calculateDeliveryEta(sellerDistance);

        return {
          id: item._id,
          title: item.title,
          name: item.title,
          price: item.price,
          mrp: item.mrp,
          oldPrice: item.mrp,
          imageUrl: item.imageUrl || item.images?.[0]?.url,
          image: item.imageUrl || item.images?.[0]?.url,
          images: item.images,
          brand: item.brand,
          rating: item.ratingAvg || 0,
          ratingAvg: item.ratingAvg || 0,
          reviewCount: item.ratingCount || 0,
          ratingCount: item.ratingCount || 0,
          stock: item.inventoryQuantity ?? item.stock ?? 10,
          commerceFlows: item.commerceFlows,
          sellerId: item.sellerId,
          sellerName: seller?.storeName || seller?.name || null,
          storeName: seller?.storeName || null,
          distanceKm: sellerDistance != null ? Number(sellerDistance.toFixed(2)) : null,
          estimatedDeliveryMinutes: eta.estimatedDeliveryMinutes,
          deliveryEtaText: eta.deliveryEtaText,
        };
      }),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
      location: coords,
      sellerCount: sellerIds.length,
      deliverable: filteredItems.length > 0,
      reason: filteredItems.length ? null : 'no_products_in_range',
    };
  }

  async _nearbyListings({ query, coords, pagination, sellerIds, sellerMap, distanceBySeller, tab }) {
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
        const seller = sellerMap?.get(String(listing.sellerId));
        const sellerDistance = distanceBySeller[String(listing.sellerId)];
        if (sellerDistance == null) return null;
        const radius = Number(product.attributes?.serviceableRadius);
        if (Number.isFinite(radius) && radius > 0 && sellerDistance > radius) {
          return null;
        }
        const eta = this._calculateDeliveryEta(sellerDistance);

        return {
          id: listing._id,
          listingId: String(listing._id),
          productId: String(product._id),
          title: product.title,
          name: product.title,
          price: listing.price,
          mrp: listing.mrp,
          oldPrice: listing.mrp,
          imageUrl: product.images?.[0]?.url || product.imageUrl,
          image: product.images?.[0]?.url || product.imageUrl,
          images: product.images,
          brand: product.brand,
          rating: product.ratingAvg || 0,
          ratingAvg: product.ratingAvg || 0,
          reviewCount: product.ratingCount || 0,
          ratingCount: product.ratingCount || 0,
          marketplaceTab: tab,
          deliveryPromiseMinutes: listing.deliveryPromiseMinutes || eta.estimatedDeliveryMinutes,
          estimatedDeliveryMinutes: eta.estimatedDeliveryMinutes,
          deliveryEtaText: eta.deliveryEtaText,
          sellerId: listing.sellerId,
          sellerName: seller?.storeName || seller?.name || null,
          storeName: seller?.storeName || null,
          distanceKm: Number(sellerDistance.toFixed(2)),
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
