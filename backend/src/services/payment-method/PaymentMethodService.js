const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');

const MAX_METHODS = 5;

class PaymentMethodService extends BaseService {
  constructor({ userPaymentMethodRepository }) {
    super();
    this.userPaymentMethodRepository = userPaymentMethodRepository;
  }

  _serialize(method) {
    return {
      id: method._id,
      type: method.type,
      last4: method.last4,
      number: `•••• •••• •••• ${method.last4}`,
      expiry: method.expiryMonth && method.expiryYear
        ? `${method.expiryMonth}/${method.expiryYear.slice(-2)}`
        : null,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      holder: method.holderName,
      holderName: method.holderName,
      isDefault: method.isDefault,
    };
  }

  async list(userId) {
    const items = await this.userPaymentMethodRepository.findByUser(userId);
    return items.map((item) => this._serialize(item));
  }

  async create(userId, data) {
    const count = await this.userPaymentMethodRepository.countByUser(userId);
    if (count >= MAX_METHODS) {
      throw AppError.validation(`Maximum ${MAX_METHODS} payment methods allowed`);
    }

    return withTransaction(async (session) => {
      const isDefault = data.isDefault || count === 0;
      if (isDefault) {
        await this.userPaymentMethodRepository.clearDefaultForUser(userId, session);
      }

      const created = await this.userPaymentMethodRepository.create(
        {
          userId,
          type: data.type || 'VISA',
          last4: data.last4,
          expiryMonth: data.expiryMonth || null,
          expiryYear: data.expiryYear || null,
          holderName: data.holderName,
          gatewayToken: `mock_${Date.now()}`,
          isDefault,
        },
        session
      );

      return this._serialize(created);
    });
  }

  async update(userId, methodId, data) {
    const method = await this.userPaymentMethodRepository.findOne({
      _id: methodId,
      userId,
      deletedAt: null,
    });
    if (!method) throw AppError.notFound('Payment method not found');

    return withTransaction(async (session) => {
      if (data.isDefault) {
        await this.userPaymentMethodRepository.clearDefaultForUser(userId, session);
      }

      const updated = await this.userPaymentMethodRepository.updateById(
        methodId,
        {
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.last4 !== undefined ? { last4: data.last4 } : {}),
          ...(data.expiryMonth !== undefined ? { expiryMonth: data.expiryMonth } : {}),
          ...(data.expiryYear !== undefined ? { expiryYear: data.expiryYear } : {}),
          ...(data.holderName !== undefined ? { holderName: data.holderName } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
        session
      );

      return this._serialize(updated);
    });
  }

  async remove(userId, methodId) {
    const method = await this.userPaymentMethodRepository.findOne({
      _id: methodId,
      userId,
      deletedAt: null,
    });
    if (!method) throw AppError.notFound('Payment method not found');

    await this.userPaymentMethodRepository.updateById(methodId, { deletedAt: new Date() });
    return { success: true };
  }

  async setDefault(userId, methodId) {
    const method = await this.userPaymentMethodRepository.findOne({
      _id: methodId,
      userId,
      deletedAt: null,
    });
    if (!method) throw AppError.notFound('Payment method not found');

    return withTransaction(async (session) => {
      await this.userPaymentMethodRepository.clearDefaultForUser(userId, session);
      const updated = await this.userPaymentMethodRepository.updateById(
        methodId,
        { isDefault: true },
        session
      );
      return this._serialize(updated);
    });
  }
}

module.exports = { PaymentMethodService };
