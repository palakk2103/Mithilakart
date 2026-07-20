const express = require('express');
const { getContainer } = require('../../bootstrap/container');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Mithilakart API v1',
      status: 'production-ready',
      phase: 10,
    },
    requestId: res.locals.requestId,
  });
});

const container = getContainer();

router.use('/auth', container.routes.customerAuth);
router.use('/seller/auth', container.routes.sellerAuth);
router.use('/admin/auth', container.routes.adminAuth);
router.use('/delivery/auth', container.routes.deliveryAuth);
router.use('/delivery', container.routes.delivery);

router.use('/', container.routes.catalog);
router.use('/cart', container.routes.cart);
router.use('/storefront', container.routes.storefront);
router.use('/cms', container.routes.cms);
router.use('/uploads', container.routes.uploads);
router.use('/orders', container.routes.orders);
router.use('/users', container.routes.users);
router.use('/coupons', container.routes.coupons);
router.use('/', container.routes.deals);
router.use('/', container.routes.engagement);
router.use('/seller', container.routes.seller);
router.use('/admin', container.routes.adminPromotions);
router.use('/admin', container.routes.adminOrders);
router.use('/admin', container.routes.adminDelivery);
router.use('/admin', container.routes.adminOperations);
router.use('/admin', container.routes.adminPlatform);
router.use('/', container.routes.payments);

router.use('/admin', container.routes.adminCatalog);
router.use('/admin', container.routes.adminCms);

router.use('/notifications', container.routes.notifications);
router.use('/support', container.routes.support);
router.use('/', container.routes.search);
router.use('/realtime', container.routes.realtime);

module.exports = router;
