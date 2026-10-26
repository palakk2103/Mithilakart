/**
 * CR-002 — the real DI graph must build with the new services attached.
 *
 * Guards against a wiring regression that unit tests with hand-built doubles
 * cannot catch: a missing require, a constructor arg renamed, or a service
 * constructed before a dependency exists.
 */
const { createIntegrationApp, resetIntegrationState } = require('../../helpers/integrationHarness');
const { getContainer } = require('../../../src/bootstrap/container');

describe('CR-002 container wiring', () => {
  let container;

  beforeAll(async () => {
    await createIntegrationApp();
    container = getContainer();
  });

  afterAll(() => {
    try {
      container.services.fulfillmentSweeper.stop();
    } catch {
      // Sweeper was never started in this harness — nothing to stop.
    }
    resetIntegrationState();
  });

  it('constructs every CR-002 service', () => {
    const { services } = container;

    expect(services.fulfillmentConfigService.constructor.name).toBe('FulfillmentConfigService');
    expect(services.sellerEligibilityService.constructor.name).toBe('SellerEligibilityService');
    expect(services.sellerRankingService.constructor.name).toBe('SellerRankingService');
    expect(services.fulfillmentReservationService.constructor.name).toBe('FulfillmentReservationService');
    expect(services.fulfillmentEngineService.constructor.name).toBe('FulfillmentEngineService');
    expect(services.fulfillmentSweeper.constructor.name).toBe('FulfillmentSweeper');
    expect(services.routingService.constructor.name).toBe('RoutingService');
  });

  it('exposes the new repositories', () => {
    expect(container.repositories.orderFulfillmentRepository).toBeTruthy();
    expect(container.repositories.fulfillmentAttemptRepository).toBeTruthy();
  });

  it('injects the engine into OrderService', () => {
    expect(container.services.orderService.fulfillmentEngineService).toBe(
      container.services.fulfillmentEngineService
    );
  });

  it('gives the engine its courier service, so fallback level 3 can run', () => {
    expect(container.services.fulfillmentEngineService.courierShipmentService).toBeTruthy();
  });

  /**
   * These stub only the database boundary. There is no live MongoDB in this
   * environment, so an unstubbed read buffers for 10s and times out; the
   * behaviour under test is the wiring above that boundary.
   */
  describe('behaviour above the database boundary', () => {
    let restore;

    beforeEach(() => {
      // Reached through the config service's own reference — that this link
      // exists at all is itself part of the wiring under test.
      const platformConfigService = container.services.fulfillmentConfigService.platformConfigService;
      expect(platformConfigService).toBeTruthy();

      const original = platformConfigService.getConfig;
      const {
        DEFAULT_PLATFORM_SETTINGS,
      } = require('../../../src/constants/platformSettings');

      platformConfigService.getConfig = async () => ({ ...DEFAULT_PLATFORM_SETTINGS });
      restore = () => { platformConfigService.getConfig = original; };
    });

    afterEach(() => { if (restore) restore(); });

    it('resolves fulfillment config with the shipped dark defaults', async () => {
      const config = await container.services.fulfillmentConfigService.resolve(null);

      expect(config.searchTimeoutSeconds).toBe(30);
      expect(config.sellerAcceptanceTimeoutSeconds).toBe(120);
      // CR-002 ships dark: these three preserve pre-CR-002 behaviour until an
      // operator explicitly opts in.
      expect(config.deliveryAssignmentMode).toBe('broadcast');
      expect(config.crossSellerSubstitutionEnabled).toBe(false);
      expect(config.routingProviderEnabled).toBe(false);
    });

    it('enables the engine only for quick-commerce tabs', async () => {
      const engine = container.services.fulfillmentEngineService;

      expect(await engine.isEnabledForTab('mithilakart')).toBe(false);
      expect(await engine.isEnabledForTab('mithilak')).toBe(false);
      expect(await engine.isEnabledForTab('quick_shop')).toBe(true);
      expect(await engine.isEnabledForTab('groceries_fresh')).toBe(true);
    });
  });

  it('runs a sweeper pass without error when nothing is pending', async () => {
    const sweeper = container.services.fulfillmentSweeper;
    const repo = container.repositories.orderFulfillmentRepository;

    const assignmentRepo = container.repositories.deliveryAssignmentRepository;

    const originals = [repo.findExpiredAcceptances, repo.findExpiredSearches];
    const originalOffers = assignmentRepo.findExpiredOffers;
    repo.findExpiredAcceptances = async () => [];
    repo.findExpiredSearches = async () => [];
    assignmentRepo.findExpiredOffers = async () => [];

    try {
      const result = await sweeper.sweepOnce();

      expect(result.errors).toBe(0);
      expect(result.acceptanceTimeouts).toBe(0);
      expect(result.searchTimeouts).toBe(0);
      expect(result.deliveryOfferTimeouts).toBe(0);
    } finally {
      [repo.findExpiredAcceptances, repo.findExpiredSearches] = originals;
      assignmentRepo.findExpiredOffers = originalOffers;
    }
  });

  it('wires the delivery ranking service and sweeps delivery offers', () => {
    expect(container.services.deliveryPartnerRankingService.constructor.name)
      .toBe('DeliveryPartnerRankingService');
    // P9 depends on both being reachable from the sweeper.
    expect(container.services.fulfillmentSweeper.deliveryAssignmentRepository).toBeTruthy();
    expect(container.services.fulfillmentSweeper.deliveryOrderService).toBeTruthy();
  });

  it('a sweeper pass survives a repository failure instead of crashing the process', async () => {
    const sweeper = container.services.fulfillmentSweeper;
    const repo = container.repositories.orderFulfillmentRepository;

    const original = repo.findExpiredAcceptances;
    repo.findExpiredAcceptances = async () => { throw new Error('db down'); };

    try {
      const result = await sweeper.sweepOnce();
      expect(result.errors).toBeGreaterThan(0);
    } finally {
      repo.findExpiredAcceptances = original;
    }
  });
});
