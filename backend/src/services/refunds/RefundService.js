const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { RETURN_STATUS } = require('../../constants/pricing');
const { REFUND_METHOD, REFUND_STATUS } = require('../../constants/wallet');
const { WALLET_TX_REFERENCE } = require('../../constants/wallet');

class RefundService extends BaseService {
  constructor({
    refundRepository,
    returnRepository,
    orderItemRepository,
    walletService,
    productRepository,
    inventoryHistoryRepository,
  }) {
    super();
    this.refundRepository = refundRepository;
    this.returnRepository = returnRepository;
    this.orderItemRepository = orderItemRepository;
    this.walletService = walletService;
    this.productRepository = productRepository;
    this.inventoryHistoryRepository = inventoryHistoryRepository;
  }

  async processRefund({ returnId, adminId, method = REFUND_METHOD.WALLET, idempotencyKey = null }) {
    if (idempotencyKey) {
      const existing = await this.refundRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return existing;
    }

    return withTransaction(async (session) => {
      const ret = await this.returnRepository.findById(returnId, { session });
      if (!ret) throw AppError.notFound('Return not found');

      if (ret.status !== RETURN_STATUS.SELLER_APPROVED && ret.status !== RETURN_STATUS.ADMIN_APPROVED) {
        throw AppError.conflict('Return must be approved before refund');
      }

      const existingRefund = await this.refundRepository.findByReturnId(returnId);
      if (existingRefund && existingRefund.status === REFUND_STATUS.COMPLETED) {
        return existingRefund;
      }

      const orderItem = await this.orderItemRepository.findById(ret.orderItemId, { session });
      const amount = orderItem ? (orderItem.unitPrice * ret.quantity) : 0;

      let refund = existingRefund;
      if (!refund) {
        refund = await this.refundRepository.create({
          returnId: ret._id,
          orderId: ret.orderId,
          userId: ret.userId,
          amount,
          method,
          status: REFUND_STATUS.PROCESSING,
          idempotencyKey,
          processedBy: adminId,
        }, session);
      }

      if (method === REFUND_METHOD.WALLET) {
        await this.walletService.credit({
          userId: ret.userId,
          amount,
          referenceType: WALLET_TX_REFERENCE.REFUND,
          referenceId: refund._id,
          description: `Refund for return ${ret._id}`,
          idempotencyKey: idempotencyKey ? `wallet:${idempotencyKey}` : null,
          session,
        });
      }

      await this.productRepository.incrementStock(ret.productId, ret.quantity, session);

      await this.returnRepository.updateById(ret._id, { status: RETURN_STATUS.REFUNDED }, session);
      await this.refundRepository.updateById(refund._id, {
        status: REFUND_STATUS.COMPLETED,
        processedAt: new Date(),
      }, session);

      return refund;
    });
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.refundRepository.find(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.refundRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const refund = await this.refundRepository.findById(id);
    if (!refund) throw AppError.notFound('Refund not found');
    return refund;
  }
}

module.exports = { RefundService };
