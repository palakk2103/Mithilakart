const { BaseService } = require('../../core/BaseService');
const { isFiniteNumber, toFiniteNumber } = require('../../utils/numeric');

/**
 * CR-002 — configurable seller ranking.
 *
 * Explicitly NOT "nearest wins". Distance is one weighted factor among six,
 * and every weight is admin-configurable, so the selection strategy can be
 * retuned without a code change.
 */
class SellerRankingService extends BaseService {
  constructor({ routingService = null, orderRepository = null, fulfillmentConfigService = null } = {}) {
    super();
    this.routingService = routingService;
    this.orderRepository = orderRepository;
    this.fulfillmentConfigService = fulfillmentConfigService;
  }

  /** Higher is better, bounded to [0,1]. */
  static normInv(value, max) {
    // A missing measurement must score 0, not 1 — Number(null) is 0, which
    // would otherwise read as "distance zero", i.e. a perfect candidate.
    if (!isFiniteNumber(value) || !isFiniteNumber(max)) return 0;

    const v = Number(value);
    const m = Number(max);
    if (m <= 0) return 0;
    return Math.min(Math.max(1 - (v / m), 0), 1);
  }

  /**
   * How much headroom the seller has beyond this order — the minimum across
   * lines, capped at 1. Prefers sellers who will not be left at zero stock.
   */
  static stockHeadroom(resolvedItems = []) {
    if (!resolvedItems.length) return 0;

    let worst = Infinity;
    for (const item of resolvedItems) {
      const required = toFiniteNumber(item.quantity, 0) || 1;
      if (!isFiniteNumber(item.availableStock)) return 0;
      worst = Math.min(worst, Number(item.availableStock) / required);
    }

    return Math.min(worst, 1);
  }

  async _currentWorkload(sellerId) {
    if (!this.orderRepository) return null;

    try {
      return await this.orderRepository.count({
        'fulfillment.sellerId': sellerId,
        status: { $in: ['placed', 'confirmed', 'packed'] },
      });
    } catch {
      // Workload is an optimisation, never a gate — an unavailable count must
      // not block ranking.
      return null;
    }
  }

  /**
   * Gathers the per-candidate measurements that ranking needs.
   * Route ETA is fetched per candidate but never allowed to fail the pass.
   */
  async collectFactors({ candidates, customerLocation, config, traceId = null }) {
    const enriched = [];

    for (const candidate of candidates) {
      const seller = candidate.seller;

      let routeEtaMinutes = null;
      let distanceKm = candidate.distanceKm ?? null;
      let routingDegraded = false;

      if (this.routingService && customerLocation) {
        const route = await this.routingService.getRouteEta({
          origin: { lat: seller.latitude, lng: seller.longitude },
          destination: { lat: customerLocation.lat, lng: customerLocation.lng },
          routingEnabled: config.routingProviderEnabled,
          fallbackSpeedKmph: config.routingFallbackSpeedKmph,
          traceId,
        });

        routeEtaMinutes = route.etaMinutes;
        routingDegraded = route.degraded;
        if (distanceKm == null) distanceKm = route.distanceKm;
      }

      // seller.preparationTimeMinutes defaults to null, meaning "inherit the
      // platform default". Reading that as 0 would make every quick-commerce
      // ETA systematically too short.
      const preparationMinutes = toFiniteNumber(
        seller.preparationTimeMinutes,
        toFiniteNumber(config.defaultPreparationTimeMinutes, 0)
      );

      enriched.push({
        ...candidate,
        distanceKm,
        routeEtaMinutes,
        routingDegraded,
        preparationMinutes,
        workload: await this._currentWorkload(seller._id),
        adminBoost: toFiniteNumber(seller.rankingBoost, 0),
      });
    }

    return enriched;
  }

  /**
   * Scores one candidate against the normalised weights.
   *
   * Weights for factors with no data are redistributed across the rest rather
   * than scoring 0, so turning off a data source cannot silently flatten the
   * whole ranking.
   */
  score(candidate, weights, config) {
    const available = [];
    const raw = {};

    if (candidate.distanceKm != null) {
      available.push('distance');
      raw.distance = SellerRankingService.normInv(candidate.distanceKm, config.sellerSearchRadiusKm);
    }

    if (candidate.routeEtaMinutes != null) {
      available.push('routeEta');
      // Reference ceiling: the radius traversed at the fallback speed.
      const maxEta = Math.max(
        5,
        (toFiniteNumber(config.sellerSearchRadiusKm, 10)
          / Math.max(1, toFiniteNumber(config.routingFallbackSpeedKmph, 18))) * 60
      );
      raw.routeEta = SellerRankingService.normInv(candidate.routeEtaMinutes, maxEta);
    }

    if (candidate.preparationMinutes != null) {
      available.push('preparation');
      const maxPrep = Math.max(1, toFiniteNumber(config.defaultPreparationTimeMinutes, 5) * 4);
      raw.preparation = SellerRankingService.normInv(candidate.preparationMinutes, maxPrep);
    }

    if (candidate.workload != null) {
      available.push('workload');
      raw.workload = SellerRankingService.normInv(candidate.workload, 20);
    }

    if (candidate.resolvedItems) {
      available.push('availability');
      raw.availability = SellerRankingService.stockHeadroom(candidate.resolvedItems);
    }

    available.push('adminBoost');
    raw.adminBoost = Math.min(Math.max(toFiniteNumber(candidate.adminBoost, 0), 0), 1);

    const effective = this.fulfillmentConfigService
      ? this.fulfillmentConfigService.redistributeWeights(weights, available)
      : weights;

    let total = 0;
    const breakdown = {};
    for (const factor of available) {
      const weight = toFiniteNumber(effective[factor], 0);
      const contribution = weight * (raw[factor] || 0);
      breakdown[factor] = { raw: raw[factor] || 0, weight, contribution };
      total += contribution;
    }

    return { score: Number(total.toFixed(6)), breakdown };
  }

  /**
   * Ranks candidates best-first.
   *
   * Ties break by distance, then by sellerId — deterministic, so the same
   * inputs always produce the same order and tests stay reproducible.
   */
  async rank({ candidates, customerLocation, config, traceId = null }) {
    if (!candidates?.length) return [];

    const enriched = await this.collectFactors({ candidates, customerLocation, config, traceId });
    const weights = config.rankingWeights || {};

    const scored = enriched.map((candidate) => {
      const { score, breakdown } = this.score(candidate, weights, config);
      return { ...candidate, rankScore: score, rankBreakdown: breakdown };
    });

    scored.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;

      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;

      return String(a.sellerId).localeCompare(String(b.sellerId));
    });

    return scored;
  }
}

module.exports = { SellerRankingService };
