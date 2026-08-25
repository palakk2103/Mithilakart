const config = require('../config');
const { getRedisClient } = require('../config/redis');
const { registerProvider, getProvider } = require('../core/providers.registry');
const { LocalStorageProvider } = require('../core/providers/LocalStorageProvider');
const { CloudinaryStorageProvider } = require('../core/providers/CloudinaryStorageProvider');


const { UserRepository } = require('../repositories/UserRepository');
const { UserAddressRepository } = require('../repositories/UserAddressRepository');
const { UserPaymentMethodRepository } = require('../repositories/UserPaymentMethodRepository');
const { SellerRepository } = require('../repositories/SellerRepository');
const { AdminUserRepository } = require('../repositories/AdminUserRepository');
const { RoleRepository } = require('../repositories/RoleRepository');
const { DeliveryPartnerRepository } = require('../repositories/DeliveryPartnerRepository');
const { RefreshTokenRepository } = require('../repositories/RefreshTokenRepository');
const { AuditLogRepository } = require('../repositories/AuditLogRepository');
const { UserDeviceRepository } = require('../repositories/UserDeviceRepository');
const { CategoryRepository } = require('../repositories/CategoryRepository');
const { ProductRepository } = require('../repositories/ProductRepository');
const { ProductVariantRepository } = require('../repositories/ProductVariantRepository');
const { BannerRepository } = require('../repositories/BannerRepository');
const { CategoryChipRepository } = require('../repositories/CategoryChipRepository');
const { HomeSectionRepository } = require('../repositories/HomeSectionRepository');
const { LegalPageRepository } = require('../repositories/LegalPageRepository');
const { CmsPageRepository } = require('../repositories/CmsPageRepository');
const { CartRepository } = require('../repositories/CartRepository');
const { CartItemRepository } = require('../repositories/CartItemRepository');
const { OrderRepository } = require('../repositories/OrderRepository');
const { OrderItemRepository } = require('../repositories/OrderItemRepository');
const { OrderTrackingRepository } = require('../repositories/OrderTrackingRepository');
const { OrderStatusHistoryRepository } = require('../repositories/OrderStatusHistoryRepository');
const { PaymentTransactionRepository } = require('../repositories/PaymentTransactionRepository');
const { PaymentWebhookRepository } = require('../repositories/PaymentWebhookRepository');
const { CouponRepository } = require('../repositories/CouponRepository');
const { InventoryHistoryRepository } = require('../repositories/InventoryHistoryRepository');
const { StockAlertRepository } = require('../repositories/StockAlertRepository');
const { ReturnRepository } = require('../repositories/ReturnRepository');
const { SellerEarningRepository } = require('../repositories/SellerEarningRepository');
const { SellerPayoutRepository } = require('../repositories/SellerPayoutRepository');
const { SellerSettlementRepository } = require('../repositories/SellerSettlementRepository');
const { SellerNotificationRepository } = require('../repositories/SellerNotificationRepository');
const { DeliveryAssignmentRepository } = require('../repositories/DeliveryAssignmentRepository');
const { DeliveryEarningRepository } = require('../repositories/DeliveryEarningRepository');
const { WalletRepository } = require('../repositories/WalletRepository');
const { GameSessionRepository } = require('../repositories/GameSessionRepository');
const { WalletTransactionRepository } = require('../repositories/WalletTransactionRepository');
const { RefundRepository } = require('../repositories/RefundRepository');
const { ReviewRepository } = require('../repositories/ReviewRepository');
const { ProductQnaRepository } = require('../repositories/ProductQnaRepository');
const { WishlistRepository } = require('../repositories/WishlistRepository');
const { FlashSaleRepository } = require('../repositories/FlashSaleRepository');
const { FlashSaleProductRepository } = require('../repositories/FlashSaleProductRepository');
const { FeaturedProductRepository } = require('../repositories/FeaturedProductRepository');
const { CouponUsageRepository } = require('../repositories/CouponUsageRepository');
const { SupportTicketRepository } = require('../repositories/SupportTicketRepository');
const { PlatformSettingRepository } = require('../repositories/PlatformSettingRepository');
const { CommissionRuleRepository } = require('../repositories/CommissionRuleRepository');
const { TaxConfigRepository } = require('../repositories/TaxConfigRepository');
const { DeliveryChargeRuleRepository } = require('../repositories/DeliveryChargeRuleRepository');
const { NotificationTemplateRepository } = require('../repositories/NotificationTemplateRepository');
const { UserNotificationRepository } = require('../repositories/UserNotificationRepository');
const { queueManager } = require('../queues/QueueManager');

const { PasswordService } = require('../services/PasswordService');
const { PermissionService } = require('../services/PermissionService');
const { OtpService } = require('../services/OtpService');
const { TokenService } = require('../services/TokenService');
const { SessionService } = require('../services/SessionService');
const { CacheService } = require('../services/CacheService');
const { UploadService } = require('../services/UploadService');
const { CartService } = require('../services/cart/CartService');
const { CartMergeService } = require('../services/cart/CartMergeService');
const { OrderService } = require('../services/orders/OrderService');
const { PaymentService } = require('../services/payments/PaymentService');
const { PricingService } = require('../services/pricing/PricingService');
const { CouponService } = require('../services/coupons/CouponService');
const { SellerProductService } = require('../services/seller/SellerProductService');
const { SellerDashboardService } = require('../services/seller/SellerDashboardService');
const { SellerAnalyticsService } = require('../services/seller/SellerAnalyticsService');
const { SellerCustomerService } = require('../services/seller/SellerCustomerService');
const { SellerReturnService } = require('../services/seller/SellerReturnService');
const { SellerSettingsService } = require('../services/seller/SellerSettingsService');
const { SellerNotificationService } = require('../services/seller/SellerNotificationService');
const { InventoryService } = require('../services/inventory/InventoryService');
const { CommissionService } = require('../services/earnings/CommissionService');
const { EarningsService } = require('../services/earnings/EarningsService');
const { PayoutService } = require('../services/earnings/PayoutService');
const { FulfillmentConfigService } = require('../services/fulfillment/FulfillmentConfigService');
const { SellerEligibilityService } = require('../services/fulfillment/SellerEligibilityService');
const { SellerRankingService } = require('../services/fulfillment/SellerRankingService');
const { DeliveryPartnerRankingService } = require('../services/fulfillment/DeliveryPartnerRankingService');
const { FulfillmentReservationService } = require('../services/fulfillment/FulfillmentReservationService');
const { FulfillmentEngineService } = require('../services/fulfillment/FulfillmentEngineService');
const { FulfillmentSweeper } = require('../services/fulfillment/FulfillmentSweeper');
const { RoutingService } = require('../services/maps/RoutingService');
const { SellerFulfillmentService } = require('../services/seller/SellerFulfillmentService');
const { DeliveryOtpService } = require('../services/delivery/DeliveryOtpService');
const { DeliveryOrderService } = require('../services/delivery/DeliveryOrderService');
const { DeliveryEarningsService } = require('../services/delivery/DeliveryEarningsService');
const { AdminDeliveryService } = require('../services/admin/AdminDeliveryService');
const { AdminFulfillmentService } = require('../services/admin/AdminFulfillmentService');
const { AdminGameService } = require('../services/admin/AdminGameService');
const { WalletService } = require('../services/wallet/WalletService');
const { GameService } = require('../services/game/GameService');
const { ReturnService } = require('../services/returns/ReturnService');
const { RefundService } = require('../services/refunds/RefundService');
const { AdminReturnService } = require('../services/admin/AdminReturnService');
const { ReviewService } = require('../services/engagement/ReviewService');
const { QnaService } = require('../services/engagement/QnaService');
const { WishlistService } = require('../services/engagement/WishlistService');
const { PromotionService } = require('../services/engagement/PromotionService');
const { AuditService } = require('../services/admin/AuditService');
const { AdminDashboardService } = require('../services/admin/AdminDashboardService');
const { AdminUserService } = require('../services/admin/AdminUserService');
const { AdminVendorService } = require('../services/admin/AdminVendorService');
const { AdminRoleService } = require('../services/admin/AdminRoleService');
const { AdminAuditService } = require('../services/admin/AdminAuditService');
const { AdminSupportService } = require('../services/admin/AdminSupportService');
const { AdminPlatformSettingsService } = require('../services/admin/AdminPlatformSettingsService');
const { AdminFinanceService } = require('../services/admin/AdminFinanceService');
const { AdminReportService } = require('../services/admin/AdminReportService');
const { AdminPromotionService, AdminSubAdminService } = require('../services/admin/AdminPromotionService');
const { UserProfileService } = require('../services/users/UserProfileService');
const { AddressService } = require('../services/address/AddressService');
const { PaymentMethodService } = require('../services/payment-method/PaymentMethodService');
const { NotificationService } = require('../services/notifications/NotificationService');
const { GeocodingService } = require('../services/maps/GeocodingService');
const { NearbyService } = require('../services/maps/NearbyService');
const { MapsController } = require('../controllers/maps/MapsController');
const { createMapsRoutes } = require('../routes/v1/maps.routes');
const { SearchService } = require('../services/search/SearchService');
const { CourierShipmentService } = require('../services/shipping/CourierShipmentService');
const { ShippingController } = require('../controllers/shipping/ShippingController');
const { createShippingRoutes } = require('../routes/v1/shipping.routes');
const { MarketplaceListingRepository } = require('../repositories/MarketplaceListingRepository');
const { MarketplaceConfigRepository } = require('../repositories/MarketplaceConfigRepository');
const { OrderFulfillmentRepository } = require('../repositories/OrderFulfillmentRepository');
const { FulfillmentAttemptRepository } = require('../repositories/FulfillmentAttemptRepository');
const { MarketplaceEngineService } = require('../services/marketplace/MarketplaceEngineService');
const { MarketplaceListingService } = require('../services/marketplace/MarketplaceListingService');
const { MarketplaceController } = require('../controllers/marketplace/MarketplaceController');
const { SellerListingController } = require('../controllers/marketplace/SellerListingController');
const { AdminListingController } = require('../controllers/marketplace/AdminListingController');
const { createMarketplaceRoutes } = require('../routes/v1/marketplace.routes');
const { createSellerListingRoutes } = require('../routes/v1/seller.listings.routes');
const { createAdminListingRoutes } = require('../routes/v1/admin.listings.routes');

const { CustomerAuthService } = require('../services/auth/CustomerAuthService');
const { SellerAuthService } = require('../services/auth/SellerAuthService');
const { AdminAuthService } = require('../services/auth/AdminAuthService');
const { DeliveryAuthService } = require('../services/auth/DeliveryAuthService');
const { CategoryService } = require('../services/catalog/CategoryService');
const { ProductService } = require('../services/catalog/ProductService');
const { StorefrontService } = require('../services/cms/StorefrontService');
const { CmsService } = require('../services/cms/CmsService');

const { CustomerAuthController } = require('../controllers/auth/CustomerAuthController');
const { SellerAuthController } = require('../controllers/auth/SellerAuthController');
const { AdminAuthController } = require('../controllers/auth/AdminAuthController');
const { DeliveryAuthController } = require('../controllers/auth/DeliveryAuthController');
const { CategoryController } = require('../controllers/catalog/CategoryController');
const { ProductController } = require('../controllers/catalog/ProductController');
const { StorefrontController } = require('../controllers/cms/StorefrontController');
const { CmsController } = require('../controllers/cms/CmsController');
const { UploadController } = require('../controllers/UploadController');
const { CartController } = require('../controllers/cart/CartController');
const { OrderController } = require('../controllers/orders/OrderController');
const { PaymentController } = require('../controllers/payments/PaymentController');
const { SellerDashboardController } = require('../controllers/seller/SellerDashboardController');
const { SellerProductController } = require('../controllers/seller/SellerProductController');
const { SellerFulfillmentController } = require('../controllers/seller/SellerFulfillmentController');
const { SellerInventoryController } = require('../controllers/seller/SellerInventoryController');
const { SellerReturnController } = require('../controllers/seller/SellerReturnController');
const { SellerCustomerController } = require('../controllers/seller/SellerCustomerController');
const { SellerCouponController } = require('../controllers/seller/SellerCouponController');
const { SellerAnalyticsController } = require('../controllers/seller/SellerAnalyticsController');
const { SellerEarningsController } = require('../controllers/seller/SellerEarningsController');
const { SellerSettingsController } = require('../controllers/seller/SellerSettingsController');
const { SellerNotificationController } = require('../controllers/seller/SellerNotificationController');
const { SellerReviewController } = require('../controllers/seller/SellerReviewController');
const { SellerQnaController } = require('../controllers/seller/SellerQnaController');
const { AdminEngagementController } = require('../controllers/admin/AdminEngagementController');
const { DeliveryDashboardController } = require('../controllers/delivery/DeliveryDashboardController');
const { DeliveryOrderController } = require('../controllers/delivery/DeliveryOrderController');
const { DeliveryEarningsController } = require('../controllers/delivery/DeliveryEarningsController');
const { AdminDeliveryController } = require('../controllers/admin/AdminDeliveryController');
const { WalletController } = require('../controllers/wallet/WalletController');
const { GameController } = require('../controllers/game/GameController');
const { ReturnController } = require('../controllers/returns/ReturnController');
const { AdminReturnController } = require('../controllers/admin/AdminReturnController');
const { AdminRefundController } = require('../controllers/admin/AdminRefundController');
const { ReviewController } = require('../controllers/engagement/ReviewController');
const { QnaController } = require('../controllers/engagement/QnaController');
const { WishlistController } = require('../controllers/engagement/WishlistController');
const { PromotionController } = require('../controllers/engagement/PromotionController');
const { CouponController } = require('../controllers/engagement/CouponController');
const { CustomerNotificationController } = require('../controllers/notifications/CustomerNotificationController');
const { SearchController } = require('../controllers/search/SearchController');
const { UserProfileController } = require('../controllers/users/UserProfileController');
const { AddressController } = require('../controllers/address/AddressController');
const { PaymentMethodController } = require('../controllers/payment-method/PaymentMethodController');

const { createAuthMiddleware } = require('../middleware/authMiddleware');

const { createCustomerAuthRoutes } = require('../routes/v1/customer.auth.routes');
const { createSellerAuthRoutes } = require('../routes/v1/seller.auth.routes');
const { createAdminAuthRoutes } = require('../routes/v1/admin.auth.routes');
const { createDeliveryAuthRoutes } = require('../routes/v1/delivery.auth.routes');
const { createCatalogRoutes } = require('../routes/v1/catalog.routes');
const { createStorefrontRoutes } = require('../routes/v1/storefront.routes');
const { createCmsRoutes } = require('../routes/v1/cms.routes');
const { createAdminCatalogRoutes, createAdminCmsRoutes } = require('../routes/v1/admin.catalog.routes');
const { createAdminContentRoutes } = require('../routes/v1/admin.content.routes');
const { createUploadRoutes } = require('../routes/v1/upload.routes');
const { createCartRoutes } = require('../routes/v1/cart.routes');
const { createOrdersRoutes } = require('../routes/v1/orders.routes');
const { createAdminOrdersRoutes } = require('../routes/v1/admin.orders.routes');
const { createPaymentsRoutes } = require('../routes/v1/payments.routes');
const { createSellerRoutes } = require('../routes/v1/seller.routes');
const { createDeliveryRoutes } = require('../routes/v1/delivery.routes');
const { createAdminDeliveryRoutes } = require('../routes/v1/admin.delivery.routes');
const { createAdminOperationsRoutes } = require('../routes/v1/admin.operations.routes');
const { createUsersRoutes } = require('../routes/v1/users.routes');
const { createCouponsRoutes } = require('../routes/v1/coupons.routes');
const { createDealsRoutes } = require('../routes/v1/deals.routes');
const { createEngagementRoutes } = require('../routes/v1/engagement.routes');
const { createAdminPlatformRoutes } = require('../routes/v1/admin.platform.routes');
const { createAdminPromotionRoutes } = require('../routes/v1/admin.promotions.routes');
const { createNotificationsRoutes, createSupportRoutes } = require('../routes/v1/notifications.routes');
const { createSearchRoutes } = require('../routes/v1/search.routes');
const { createRealtimeRoutes } = require('../routes/v1/realtime.routes');

let container = null;

function buildContainer() {
  const redisClient = getRedisClient();
  if (config.storage?.provider === 'cloudinary') {
    registerProvider('storage', new CloudinaryStorageProvider(config.storage.cloudinary));
  } else {
    registerProvider('storage', new LocalStorageProvider());
  }


  const userRepository = new UserRepository();
  const userAddressRepository = new UserAddressRepository();
  const userPaymentMethodRepository = new UserPaymentMethodRepository();
  const sellerRepository = new SellerRepository();
  const adminUserRepository = new AdminUserRepository();
  const roleRepository = new RoleRepository();
  const deliveryPartnerRepository = new DeliveryPartnerRepository();
  const refreshTokenRepository = new RefreshTokenRepository();
  const auditLogRepository = new AuditLogRepository();
  const userDeviceRepository = new UserDeviceRepository();
  const categoryRepository = new CategoryRepository();
  const productRepository = new ProductRepository();
  const productVariantRepository = new ProductVariantRepository();
  const bannerRepository = new BannerRepository();
  const categoryChipRepository = new CategoryChipRepository();
  const homeSectionRepository = new HomeSectionRepository();
  const legalPageRepository = new LegalPageRepository();
  const cmsPageRepository = new CmsPageRepository();

  const cartRepository = new CartRepository();
  const cartItemRepository = new CartItemRepository();
  const orderRepository = new OrderRepository();
  const orderItemRepository = new OrderItemRepository();
  const orderTrackingRepository = new OrderTrackingRepository();
  const orderStatusHistoryRepository = new OrderStatusHistoryRepository();
  const paymentTransactionRepository = new PaymentTransactionRepository();
  const paymentWebhookRepository = new PaymentWebhookRepository();
  const couponRepository = new CouponRepository();
  const inventoryHistoryRepository = new InventoryHistoryRepository();
  const stockAlertRepository = new StockAlertRepository();
  const returnRepository = new ReturnRepository();
  const sellerEarningRepository = new SellerEarningRepository();
  const sellerPayoutRepository = new SellerPayoutRepository();
  const sellerSettlementRepository = new SellerSettlementRepository();
  const sellerNotificationRepository = new SellerNotificationRepository();
  const deliveryAssignmentRepository = new DeliveryAssignmentRepository();
  const deliveryEarningRepository = new DeliveryEarningRepository();
  const walletRepository = new WalletRepository();
  const walletTransactionRepository = new WalletTransactionRepository();
  const gameSessionRepository = new GameSessionRepository();
  const refundRepository = new RefundRepository();
  const reviewRepository = new ReviewRepository();
  const productQnaRepository = new ProductQnaRepository();
  const wishlistRepository = new WishlistRepository();
  const flashSaleRepository = new FlashSaleRepository();
  const flashSaleProductRepository = new FlashSaleProductRepository();
  const featuredProductRepository = new FeaturedProductRepository();
  const couponUsageRepository = new CouponUsageRepository();
  const supportTicketRepository = new SupportTicketRepository();
  const platformSettingRepository = new PlatformSettingRepository();
  const commissionRuleRepository = new CommissionRuleRepository();
  const taxConfigRepository = new TaxConfigRepository();
  const deliveryChargeRuleRepository = new DeliveryChargeRuleRepository();
  const notificationTemplateRepository = new NotificationTemplateRepository();
  const userNotificationRepository = new UserNotificationRepository();
  const marketplaceListingRepository = new MarketplaceListingRepository();
  const marketplaceConfigRepository = new MarketplaceConfigRepository();
  const orderFulfillmentRepository = new OrderFulfillmentRepository();
  const fulfillmentAttemptRepository = new FulfillmentAttemptRepository();

  const couponService = new CouponService({ couponRepository, couponUsageRepository });

  const passwordService = new PasswordService();
  const permissionService = new PermissionService();
  const otpService = new OtpService(redisClient, config, getProvider('sms'));
  const tokenService = new TokenService(refreshTokenRepository, redisClient, config);
  const sessionService = new SessionService(refreshTokenRepository, userDeviceRepository);
  const cacheService = new CacheService(redisClient);
  const { PlatformConfigService } = require('../services/platform/PlatformConfigService');
  const platformConfigService = new PlatformConfigService({
    platformSettingRepository,
    deliveryChargeRuleRepository,
    cacheService,
  });
  const pricingService = new PricingService({ couponService, platformConfigService });
  const uploadService = new UploadService(config);
  const geocodingService = new GeocodingService();

  const marketplaceEngineService = new MarketplaceEngineService({ marketplaceConfigRepository });
  const marketplaceListingService = new MarketplaceListingService({
    marketplaceListingRepository,
    marketplaceEngineService,
    productRepository,
    categoryRepository,
    sellerRepository,
  });

  const cartService = new CartService({
    redisClient,
    productRepository,
    pricingService,
    marketplaceListingService,
  });

  const cartMergeService = new CartMergeService({
    redisClient,
    cartService,
  });

  const customerAuthService = new CustomerAuthService({
    userRepository,
    otpService,
    tokenService,
    sessionService,
    config,
    cartMergeService,
  });

  const sellerAuthService = new SellerAuthService({
    sellerRepository,
    passwordService,
    tokenService,
    sessionService,
    otpService,
    geocodingService,
  });

  const adminAuthService = new AdminAuthService({
    adminUserRepository,
    auditLogRepository,
    passwordService,
    permissionService,
    tokenService,
    sessionService,
  });

  const deliveryAuthService = new DeliveryAuthService({
    deliveryPartnerRepository,
    otpService,
    tokenService,
    sessionService,
    geocodingService,
  });

  const categoryService = new CategoryService(categoryRepository, cacheService);
  const productService = new ProductService(
    productRepository,
    productVariantRepository,
    categoryRepository,
    cacheService,
    marketplaceListingService
  );

  const storefrontService = new StorefrontService({
    bannerRepository,
    categoryChipRepository,
    homeSectionRepository,
    productRepository,
    categoryService,
    cacheService,
    platformConfigService,
  });

  const cmsService = new CmsService({
    bannerRepository,
    categoryChipRepository,
    homeSectionRepository,
    legalPageRepository,
    cmsPageRepository,
    cacheService,
  });

  const middleware = createAuthMiddleware({
    tokenService,
    sellerRepository,
    deliveryPartnerRepository,
  });

  const categoryController = new CategoryController(categoryService);
  const productController = new ProductController(productService);
  const storefrontController = new StorefrontController(storefrontService);
  const cmsController = new CmsController(cmsService);
  const uploadController = new UploadController(uploadService);

  const paymentService = new PaymentService({
    paymentTransactionRepository,
    paymentWebhookRepository,
    orderRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
  });

  const geocodingServiceRef = geocodingService;
  const nearbyService = new NearbyService({
    sellerRepository,
    productRepository,
    marketplaceListingRepository,
    geocodingService: geocodingServiceRef,
  });
  const mapsController = new MapsController(nearbyService);

  const courierShipmentService = new CourierShipmentService({
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    productRepository,
    sellerRepository,
  });

  const orderService = new OrderService({
    cartService,
    productRepository,
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    paymentService,
    pricingService,
    couponService,
    cartRepository,
    cartItemRepository,
    userAddressRepository,
    geocodingService: geocodingServiceRef,
    courierShipmentService,
  });

  // ── CR-002 — intelligent fulfillment ──────────────────────────────────────
  // Wired after orderService so the engine can be injected into it below.
  // If any of this were absent, OrderService falls back to its pre-CR-002
  // behaviour, which is why the injection is optional rather than required.
  const fulfillmentConfigService = new FulfillmentConfigService({
    platformConfigService,
    marketplaceConfigRepository,
  });
  const sellerEligibilityService = new SellerEligibilityService({
    sellerRepository,
    productRepository,
    marketplaceListingRepository,
  });
  const routingService = new RoutingService({ platformConfigService });
  const sellerRankingService = new SellerRankingService({
    routingService,
    orderRepository,
    fulfillmentConfigService,
  });
  const fulfillmentReservationService = new FulfillmentReservationService({
    productRepository,
    fulfillmentAttemptRepository,
  });
  const fulfillmentEngineService = new FulfillmentEngineService({
    orderRepository,
    orderItemRepository,
    orderFulfillmentRepository,
    fulfillmentAttemptRepository,
    sellerEligibilityService,
    sellerRankingService,
    fulfillmentReservationService,
    fulfillmentConfigService,
    routingService,
    sellerRepository,
    productRepository,
    marketplaceConfigRepository,
    courierShipmentService,
  });
  const deliveryPartnerRankingService = new DeliveryPartnerRankingService({
    deliveryAssignmentRepository,
    routingService,
  });
  const fulfillmentSweeper = new FulfillmentSweeper({
    orderFulfillmentRepository,
    fulfillmentEngineService,
    fulfillmentConfigService,
    deliveryAssignmentRepository,
    // deliveryOrderService is constructed further down; injected via setter.
  });

  orderService.setFulfillmentEngineService(fulfillmentEngineService);

  const sellerFulfillmentService = new SellerFulfillmentService({
    orderRepository,
    fulfillmentAttemptRepository,
    fulfillmentEngineService,
    // CR-002 P7 — resolves product titles/images so the seller offer popup can
    // show WHAT to pack, not just how many lines.
    productRepository,
  });

  const shippingController = new ShippingController({ courierShipmentService });
  const marketplaceController = new MarketplaceController({
    marketplaceEngineService,
    marketplaceListingService,
  });
  const sellerListingController = new SellerListingController({ marketplaceListingService });
  const adminListingController = new AdminListingController({ marketplaceListingService });

  paymentService.setOrderService(orderService);

  const sellerProductService = new SellerProductService({
    productRepository,
    productVariantRepository,
    categoryRepository,
    cacheService,
    sellerRepository,
  });

  const sellerDashboardService = new SellerDashboardService({
    productRepository,
    orderItemRepository,
    orderRepository,
    returnRepository,
    sellerEarningRepository,
    cacheService,
  });

  const sellerAnalyticsService = new SellerAnalyticsService({
    orderItemRepository,
    productRepository,
  });

  const sellerCustomerService = new SellerCustomerService({ userRepository });
  const sellerReturnService = new SellerReturnService({ returnRepository });
  const commissionService = new CommissionService();
  const earningsService = new EarningsService({
    sellerEarningRepository,
    sellerSettlementRepository,
    sellerRepository,
    commissionService,
  });
  const payoutService = new PayoutService({
    sellerPayoutRepository,
    sellerRepository,
    sellerEarningRepository,
  });
  const inventoryService = new InventoryService({
    productRepository,
    inventoryHistoryRepository,
    stockAlertRepository,
  });
  const sellerSettingsService = new SellerSettingsService({
    sellerRepository,
    passwordService,
  });
  const sellerNotificationService = new SellerNotificationService({
    sellerNotificationRepository,
  });

  const deliveryOtpService = new DeliveryOtpService({ redisClient });
  const deliveryOrderService = new DeliveryOrderService({
    deliveryAssignmentRepository,
    deliveryPartnerRepository,
    deliveryEarningRepository,
    deliveryOtpService,
    orderRepository,
    orderItemRepository,
    sellerRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    userDeviceRepository,
    // CR-002 P9 — ranked offers. Inert while deliveryAssignmentMode='broadcast'.
    deliveryPartnerRankingService,
    fulfillmentConfigService,
  });
  orderService.setDeliveryOrderService(deliveryOrderService);
  fulfillmentSweeper.setDeliveryOrderService(deliveryOrderService);
  const deliveryEarningsService = new DeliveryEarningsService({ deliveryEarningRepository });
  const adminDeliveryService = new AdminDeliveryService({ deliveryPartnerRepository });

  const walletService = new WalletService({ walletRepository, walletTransactionRepository });
  const gameService = new GameService({
    gameSessionRepository,
    orderRepository,
    walletService,
    platformConfigService,
  });
  const returnService = new ReturnService({ returnRepository, orderRepository, orderItemRepository });
  const refundService = new RefundService({
    refundRepository,
    returnRepository,
    orderItemRepository,
    walletService,
    productRepository,
    inventoryHistoryRepository,
  });
  const adminReturnService = new AdminReturnService({ returnRepository });

  const reviewService = new ReviewService({
    reviewRepository,
    orderRepository,
    orderItemRepository,
    productRepository,
  });
  const qnaService = new QnaService({ productQnaRepository, productRepository });
  const wishlistService = new WishlistService({ wishlistRepository, productRepository });
  const promotionService = new PromotionService({
    flashSaleRepository,
    flashSaleProductRepository,
    featuredProductRepository,
    productRepository,
    couponRepository,
  });
  productService.setPromotionService(promotionService);

  const auditService = new AuditService({ auditLogRepository });
  const adminDashboardService = new AdminDashboardService({ orderRepository, cacheService });
  const adminUserService = new AdminUserService({ userRepository, walletRepository, orderRepository });
  const adminVendorService = new AdminVendorService({
    sellerRepository,
    productRepository,
    orderItemRepository,
    sellerEarningRepository,
  });
  const adminRoleService = new AdminRoleService({ roleRepository, adminUserRepository });
  const adminAuditService = new AdminAuditService({ auditLogRepository });
  const adminSupportService = new AdminSupportService({ supportTicketRepository });
  const adminPlatformSettingsService = new AdminPlatformSettingsService({
    platformSettingRepository,
    commissionRuleRepository,
    platformConfigService,
  });
  const adminFinanceService = new AdminFinanceService({
    commissionRuleRepository,
    taxConfigRepository,
    deliveryChargeRuleRepository,
    sellerEarningRepository,
    sellerPayoutRepository,
    platformConfigService,
  });
  const adminReportService = new AdminReportService();
  const adminPromotionService = new AdminPromotionService({
    couponRepository,
    promotionService,
    flashSaleRepository,
    flashSaleProductRepository,
    featuredProductRepository,
    productRepository,
  });
  const adminSubAdminService = new AdminSubAdminService({
    adminUserRepository,
    roleRepository,
    passwordService,
  });
  const userProfileService = new UserProfileService({ userRepository });
  const addressService = new AddressService({ userAddressRepository, geocodingService });
  const paymentMethodService = new PaymentMethodService({ userPaymentMethodRepository });
  const searchService = new SearchService({ productService, categoryRepository, cacheService });
  const notificationService = new NotificationService({
    userNotificationRepository,
    notificationTemplateRepository,
    userRepository,
    userDeviceRepository,
    deliveryPartnerRepository,
    sellerNotificationRepository,
  });

  queueManager.registerQueue('notifications', {
    add: async (_jobName, data) => {
      await notificationService.dispatch(data);
      return { queued: true };
    },
  });
  queueManager.markConnected();

  const adminServices = {
    dashboard: adminDashboardService,
    users: adminUserService,
    vendors: adminVendorService,
    roles: adminRoleService,
    audit: adminAuditService,
    support: adminSupportService,
    settings: adminPlatformSettingsService,
    finance: adminFinanceService,
    reports: adminReportService,
    notifications: notificationService,
    promotions: adminPromotionService,
    subAdmins: adminSubAdminService,
    // CR-002 — validating façade over the same settings store as `settings`.
    fulfillment: new AdminFulfillmentService({
      adminPlatformSettingsService,
      fulfillmentConfigService,
      orderFulfillmentRepository,
      fulfillmentAttemptRepository,
      orderRepository,
      deliveryAssignmentRepository,
      fulfillmentEngineService,
      auditService: adminAuditService,
    }),
    // "Catch Your Delivery" — same validating-façade pattern as `fulfillment`.
    game: new AdminGameService({
      adminPlatformSettingsService,
      platformConfigService,
    }),
  };

  const cartController = new CartController(cartService, cartMergeService);
  const orderController = new OrderController(orderService);
  const paymentController = new PaymentController(paymentService, orderRepository);
  const returnController = new ReturnController(returnService);
  const walletController = new WalletController(walletService);
  const gameController = new GameController(gameService);
  const reviewController = new ReviewController(reviewService);
  const qnaController = new QnaController(qnaService);
  const wishlistController = new WishlistController(wishlistService);
  const promotionController = new PromotionController(promotionService);
  const couponController = new CouponController(couponService);
  const customerNotificationController = new CustomerNotificationController(notificationService, adminSupportService);
  const searchController = new SearchController(searchService);
  const userProfileController = new UserProfileController(userProfileService);
  const addressController = new AddressController(addressService);
  const paymentMethodController = new PaymentMethodController(paymentMethodService);

  const deliveryControllers = {
    dashboard: new DeliveryDashboardController(deliveryOrderService),
    orders: new DeliveryOrderController(deliveryOrderService),
    earnings: new DeliveryEarningsController(deliveryEarningsService),
  };

  const sellerControllers = {
    dashboard: new SellerDashboardController(sellerDashboardService),
    products: new SellerProductController(sellerProductService),
    orders: orderController,
    returns: new SellerReturnController(sellerReturnService),
    customers: new SellerCustomerController(sellerCustomerService),
    inventory: new SellerInventoryController(inventoryService),
    coupons: new SellerCouponController(couponService),
    analytics: new SellerAnalyticsController(sellerAnalyticsService),
    earnings: new SellerEarningsController(earningsService, payoutService),
    settings: new SellerSettingsController(sellerSettingsService),
    notifications: new SellerNotificationController(sellerNotificationService),
    reviews: new SellerReviewController(reviewService),
    questions: new SellerQnaController(qnaService),
    // CR-002 — additive; the existing seller order routes are unchanged.
    fulfillment: new SellerFulfillmentController(sellerFulfillmentService),
  };

  const adminEngagementController = new AdminEngagementController(reviewService, qnaService);

  return {
    config,
    repositories: {
      userRepository,
      sellerRepository,
      adminUserRepository,
      roleRepository,
      deliveryPartnerRepository,
      refreshTokenRepository,
      auditLogRepository,
      userDeviceRepository,
      categoryRepository,
      cartRepository,
      cartItemRepository,
      productRepository,
      productVariantRepository,
      bannerRepository,
      categoryChipRepository,
      homeSectionRepository,
      legalPageRepository,
      cmsPageRepository,
      orderRepository,
      orderItemRepository,
      orderTrackingRepository,
      orderStatusHistoryRepository,
      orderFulfillmentRepository,
      fulfillmentAttemptRepository,
      paymentTransactionRepository,
      paymentWebhookRepository,
      couponRepository,
      inventoryHistoryRepository,
      stockAlertRepository,
      returnRepository,
      sellerEarningRepository,
      sellerPayoutRepository,
      sellerSettlementRepository,
      sellerNotificationRepository,
      deliveryAssignmentRepository,
      deliveryEarningRepository,
      walletRepository,
      walletTransactionRepository,
      refundRepository,
      reviewRepository,
      productQnaRepository,
      wishlistRepository,
      flashSaleRepository,
      flashSaleProductRepository,
      featuredProductRepository,
      couponUsageRepository,
      supportTicketRepository,
      platformSettingRepository,
      commissionRuleRepository,
      taxConfigRepository,
      deliveryChargeRuleRepository,
      notificationTemplateRepository,
      userNotificationRepository,
    },
    services: {
      passwordService,
      permissionService,
      otpService,
      tokenService,
      sessionService,
      cacheService,
      uploadService,
      customerAuthService,
      sellerAuthService,
      adminAuthService,
      deliveryAuthService,
      categoryService,
      productService,
      storefrontService,
      cmsService,
      cartService,
      cartMergeService,
      orderService,
      // CR-002
      fulfillmentConfigService,
      sellerEligibilityService,
      sellerRankingService,
      fulfillmentReservationService,
      fulfillmentEngineService,
      sellerFulfillmentService,
      fulfillmentSweeper,
      deliveryPartnerRankingService,
      routingService,
      paymentService,
      pricingService,
      couponService,
      sellerProductService,
      sellerDashboardService,
      sellerAnalyticsService,
      sellerCustomerService,
      sellerReturnService,
      inventoryService,
      commissionService,
      earningsService,
      payoutService,
      sellerSettingsService,
      sellerNotificationService,
      deliveryOtpService,
      deliveryOrderService,
      deliveryEarningsService,
      adminDeliveryService,
      walletService,
      returnService,
      refundService,
      adminReturnService,
      reviewService,
      qnaService,
      wishlistService,
      promotionService,
      auditService,
      adminDashboardService,
      adminUserService,
      adminVendorService,
      adminRoleService,
      adminAuditService,
      adminSupportService,
      adminPlatformSettingsService,
      adminFinanceService,
      adminReportService,
      notificationService,
      searchService,
    },
    controllers: {
      customerAuthController: new CustomerAuthController(customerAuthService),
      sellerAuthController: new SellerAuthController(sellerAuthService),
      adminAuthController: new AdminAuthController(adminAuthService),
      deliveryAuthController: new DeliveryAuthController(deliveryAuthService),
      categoryController,
      productController,
      storefrontController,
      cmsController,
      uploadController,
      cartController,
      orderController,
      paymentController,
      returnController,
      walletController,
      reviewController,
      qnaController,
      wishlistController,
      promotionController,
      couponController,
      customerNotificationController,
      searchController,
      adminServices,
      adminDeliveryController: new AdminDeliveryController(adminDeliveryService),
      adminReturnController: new AdminReturnController(adminReturnService),
      adminRefundController: new AdminRefundController(refundService),
      deliveryControllers,
      sellerControllers,
    },
    middleware,
    routes: {
      customerAuth: createCustomerAuthRoutes(
        new CustomerAuthController(customerAuthService),
        middleware
      ),
      sellerAuth: createSellerAuthRoutes(
        new SellerAuthController(sellerAuthService),
        middleware
      ),
      adminAuth: createAdminAuthRoutes(
        new AdminAuthController(adminAuthService),
        middleware
      ),
      deliveryAuth: createDeliveryAuthRoutes(
        new DeliveryAuthController(deliveryAuthService),
        middleware
      ),
      catalog: createCatalogRoutes(categoryController, productController),
      storefront: createStorefrontRoutes(storefrontController),
      cms: createCmsRoutes(cmsController),
      adminCatalog: createAdminCatalogRoutes(
        { categoryController, productController },
        middleware
      ),
      adminCms: createAdminCmsRoutes(cmsController, middleware),
      adminContent: createAdminContentRoutes(adminEngagementController, middleware),
      uploads: createUploadRoutes(uploadController, middleware),
      cart: createCartRoutes(cartController, middleware),
      orders: createOrdersRoutes({ orderController, returnController, gameController }, middleware),
      seller: createSellerRoutes(sellerControllers, middleware),
      delivery: createDeliveryRoutes(deliveryControllers, middleware),
      adminOrders: createAdminOrdersRoutes(orderController, middleware),
      adminDelivery: createAdminDeliveryRoutes(
        new AdminDeliveryController(adminDeliveryService),
        middleware
      ),
      adminOperations: createAdminOperationsRoutes({
        returnController: new AdminReturnController(adminReturnService),
        refundController: new AdminRefundController(refundService),
      }, middleware),
      adminPlatform: createAdminPlatformRoutes(adminServices, middleware),
      adminPromotions: createAdminPromotionRoutes(adminServices, middleware),
      users: createUsersRoutes({
        userProfileController,
        addressController,
        paymentMethodController,
        walletController,
        wishlistController,
        reviewController,
        qnaController,
        couponController,
        notificationController: customerNotificationController,
        returnController,
      }, middleware),
      notifications: createNotificationsRoutes(customerNotificationController, middleware),
      support: createSupportRoutes(customerNotificationController, middleware),
      search: createSearchRoutes(searchController),
      realtime: createRealtimeRoutes(middleware),
      coupons: createCouponsRoutes(couponController, middleware),
      deals: createDealsRoutes(promotionController),
      engagement: createEngagementRoutes({ reviewController, qnaController }, middleware),
      payments: createPaymentsRoutes(paymentController, middleware),
      shipping: createShippingRoutes(shippingController, middleware),
      marketplace: createMarketplaceRoutes(marketplaceController),
      sellerListings: createSellerListingRoutes(sellerListingController, middleware),
      adminListings: createAdminListingRoutes(adminListingController, middleware),
      maps: createMapsRoutes(mapsController),
    },
  };
}

function getContainer() {
  if (!container) {
    container = buildContainer();
  }

  return container;
}

function resetContainer() {
  container = null;
}

module.exports = {
  buildContainer,
  getContainer,
  resetContainer,
};
