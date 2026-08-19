const { BaseService } = require('../../core/BaseService');
const { haversineKm } = require('../../utils/geoHelper');
const { toFiniteNumber, isFiniteNumber } = require('../../utils/numeric');
const { ASSIGNMENT_STATUS } = require('../../constants/delivery');

/**
 * CR-002 — ranks delivery partners for a targeted offer.
 *
 * Mirrors SellerRankingService: weighted, normalised, deterministic ties. The
 * partner nearest the pickup point does not automatically win — an overloaded
 * or stale-location partner can lose to one slightly further away.
 *
 * Only used when deliveryAssignmentMode = 'ranked'. The shipped default is
 * 'broadcast', which leaves the existing first-come-first-served flow intact.
 */
const DEFAULT_PARTNER_WEIGHTS = {
  pickupDistance: 0.45,
  routeEta: 0.20,
  workload: 0.25,
  locationFreshness: 0.10,
};

/** A location older than this tells us little about where the partner is now. */
const LOCATION_STALE_AFTER_MS = 5 * 60 * 1000;

class DeliveryPartnerRankingService extends BaseService {
  constructor({ deliveryAssignmentRepository = null, routingService = null } = {}) {
    super();
    this.deliveryAssignmentRepository = deliveryAssignmentRepository;
    this.routingService = routingService;
  }

  static get DEFAULT_WEIGHTS() {
    return { ...DEFAULT_PARTNER_WEIGHTS };
  }

  static normInv(value, max) {
    if (!isFiniteNumber(value) || !isFiniteNumber(max)) return 0;
    const m = Number(max);
    if (m <= 0) return 0;
    return Math.min(Math.max(1 - (Number(value) / m), 0), 1);
  }

  /** Active deliveries already on this partner's plate. */
  async _workload(partnerId) {
    if (!this.deliveryAssignmentRepository) return null;

    try {
      return await this.deliveryAssignmentRepository.countByPartner(partnerId, {
        status: { $in: [ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.PICKED_UP] },
      });
    } catch {
      // Workload is an optimisation, never a gate.
      return null;
    }
  }

  _locationFreshness(partner) {
    const stamp = partner.lastLocationAt || partner.updatedAt;
    if (!stamp) return 0;

    const ageMs = Date.now() - new Date(stamp).getTime();
    if (!Number.isFinite(ageMs) || ageMs < 0) return 1;

    return Math.min(Math.max(1 - (ageMs / LOCATION_STALE_AFTER_MS), 0), 1);
  }

  /**
   * Eligibility gate, applied before ranking.
   *
   * Mirrors the checks the existing flow already relies on (approved, online,
   * has a location) and adds CR-002's workload cap and per-order exclusions.
   */
  isEligible(partner, { rejectedBy = [], maxConcurrentDeliveries = null, workload = null } = {}) {
    if (!partner) return { ok: false, reason: 'missing' };
    if (partner.deletedAt) return { ok: false, reason: 'deleted' };
    if (partner.status !== 'approved') return { ok: false, reason: 'not_approved' };
    if (!partner.isOnline) return { ok: false, reason: 'offline' };
    if (partner.latitude == null || partner.longitude == null) return { ok: false, reason: 'no_location' };

    const excluded = new Set((rejectedBy || []).map(String));
    if (excluded.has(String(partner._id))) return { ok: false, reason: 'already_rejected' };

    if (isFiniteNumber(maxConcurrentDeliveries) && isFiniteNumber(workload)
      && Number(workload) >= Number(maxConcurrentDeliveries)) {
      return { ok: false, reason: 'overloaded' };
    }

    return { ok: true, reason: null };
  }

  /**
   * Ranks eligible partners best-first.
   *
   * `pickupLocation` is the seller/warehouse the partner must reach first —
   * that leg, not the customer leg, is what the partner is being asked to
   * commit to right now.
   */
  async rank({
    partners,
    pickupLocation,
    customerLocation = null,
    config = {},
    rejectedBy = [],
    traceId = null,
  }) {
    if (!partners?.length || !pickupLocation) return { ranked: [], rejected: [] };

    const weights = config.partnerRankingWeights || DEFAULT_PARTNER_WEIGHTS;
    const searchRadiusKm = toFiniteNumber(config.sellerSearchRadiusKm, 10);
    const maxConcurrent = toFiniteNumber(config.maxConcurrentDeliveries, null);

    const ranked = [];
    const rejected = [];

    for (const partner of partners) {
      const workload = await this._workload(partner._id);
      const eligibility = this.isEligible(partner, {
        rejectedBy, maxConcurrentDeliveries: maxConcurrent, workload,
      });

      if (!eligibility.ok) {
        rejected.push({ partnerId: partner._id, reason: eligibility.reason });
        continue;
      }

      const pickupDistanceKm = haversineKm(
        partner.latitude, partner.longitude, pickupLocation.lat, pickupLocation.lng
      );

      let routeEtaMinutes = null;
      if (this.routingService) {
        const route = await this.routingService.getRouteEta({
          origin: { lat: partner.latitude, lng: partner.longitude },
          destination: { lat: pickupLocation.lat, lng: pickupLocation.lng },
          routingEnabled: config.routingProviderEnabled,
          fallbackSpeedKmph: config.routingFallbackSpeedKmph,
          traceId,
        });
        routeEtaMinutes = route.etaMinutes;
      }

      const maxEta = Math.max(
        5,
        (searchRadiusKm / Math.max(1, toFiniteNumber(config.routingFallbackSpeedKmph, 18))) * 60
      );

      const raw = {
        pickupDistance: DeliveryPartnerRankingService.normInv(pickupDistanceKm, searchRadiusKm),
        routeEta: routeEtaMinutes == null ? null
          : DeliveryPartnerRankingService.normInv(routeEtaMinutes, maxEta),
        workload: workload == null ? null
          : DeliveryPartnerRankingService.normInv(workload, maxConcurrent || 10),
        locationFreshness: this._locationFreshness(partner),
      };

      // Redistribute the weight of unavailable factors instead of scoring them
      // zero, so a missing data source cannot flatten the ranking.
      const available = Object.keys(raw).filter((key) => raw[key] != null);
      const availableTotal = available.reduce((sum, key) => sum + (toFiniteNumber(weights[key], 0)), 0);

      let score = 0;
      const breakdown = {};
      for (const key of available) {
        const weight = availableTotal > 0
          ? toFiniteNumber(weights[key], 0) / availableTotal
          : 0;
        const contribution = weight * raw[key];
        breakdown[key] = { raw: raw[key], weight, contribution };
        score += contribution;
      }

      ranked.push({
        partnerId: partner._id,
        partner,
        pickupDistanceKm: Number(pickupDistanceKm.toFixed(3)),
        routeEtaMinutes,
        workload,
        rankScore: Number(score.toFixed(6)),
        rankBreakdown: breakdown,
        customerLocation,
      });
    }

    ranked.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (a.pickupDistanceKm !== b.pickupDistanceKm) return a.pickupDistanceKm - b.pickupDistanceKm;
      return String(a.partnerId).localeCompare(String(b.partnerId));
    });

    return { ranked, rejected };
  }
}

module.exports = { DeliveryPartnerRankingService, DEFAULT_PARTNER_WEIGHTS };
