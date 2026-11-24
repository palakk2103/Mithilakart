const crypto = require('crypto');
const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { logger } = require('../../utils/logger');
const { eventBus } = require('../../events/EventBus');
const { WALLET_TX_REFERENCE } = require('../../constants/wallet');
const { computeCashback, resolveCashback } = require('./cashback');
const GiftCard = require('../../models/GiftCard');
const OrderCredit = require('../../models/OrderCredit');

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Crockford alphabet: no I, L, O, U, so a code read over the phone is not misheard.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 16; // 80 random bits
const MAX_BAD_CODES = 6;
const BAD_CODE_WINDOW_SECONDS = 15 * 60;

const cleanCode = (code) => String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
const hashCode = (code) => crypto.createHash('sha256').update(`mk-gift:${cleanCode(code)}`).digest('hex');
const formatCode = (code) => code.match(/.{4}/g).join('-');
const newCode = () => Array.from({ length: CODE_LENGTH }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');

const creditError = (error) => Object.assign(error, { isCreditError: true });
// Wrong, frozen, deleted and someone else's card all read the same.
const invalidCard = () => creditError(AppError.notFound('This gift card is not valid'));

/** Never leave an amount a payment gateway refuses (between ₹0 and ₹1). */
function usable(available, due) {
  const use = money(Math.min(available, due));
  const left = money(due - use);
  return left > 0 && left < 1 ? money(Math.max(0, due - 1)) : use;
}

/**
 * Everything that reduces what an order has to be paid with: cashback, a gift
 * card and wallet money. The order's `total` is the net amount, so the payment
 * gateway and the cash collected at the door are right without knowing about it.
 */
class OrderCreditsService extends BaseService {
  constructor({ walletService, userRepository, orderRepository, platformConfigService, redisClient = null }) {
    super();
    this.walletService = walletService;
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.platformConfigService = platformConfigService;
    this.redis = redisClient;
  }

  registerListeners() {
    eventBus.subscribe('order.status_changed', (event) => {
      if (event?.payload?.status !== 'delivered') return;
      // The event is published just before the delivery transaction commits, so a
      // single immediate read can still see the old status: try again shortly.
      [0, 2000, 15000].forEach((ms) => {
        const timer = setTimeout(() => {
          this.creditDelivered(event.payload.orderId)
            .catch((err) => logger.error({ err, orderId: event.payload.orderId }, 'Cashback credit failed — will be retried'));
        }, ms);
        timer.unref?.();
      });
    });
  }

  // ─── Pricing ──────────────────────────────────────────────────────────────

  async _cashbackUsesLeft(config, userId) {
    const c = resolveCashback(config);
    const limit = Math.floor(Number(c.perCustomer) || 0);
    if (!c.enabled || limit <= 0) return null;
    if (!userId) return limit;
    const used = await OrderCredit.countDocuments({ kind: 'cashback', campaign: String(c.campaign || 'default'), userId });
    return Math.max(0, limit - used);
  }

  /**
   * Applies the credits to a gross total. Only reads; `commit` spends.
   * With `lenient`, a gift card problem comes back as `giftCardError` instead of throwing.
   */
  async apply({
    config, userId = null, marketplaceTab = null, paymentMethod = null, goodsValue = 0, total = 0,
    giftCardCode = null, useWallet = false, lenient = false,
  }) {
    let due = money(total);
    const cashback = computeCashback(config, {
      value: goodsValue,
      marketplaceTab,
      paymentMethod,
      usesLeft: await this._cashbackUsesLeft(config, userId),
    });
    if (cashback.mode === 'instant' && cashback.amount > 0) {
      cashback.amount = usable(cashback.amount, due);
      due = money(due - cashback.amount);
    }

    let giftCard = null;
    let giftCardError = null;
    if (giftCardCode && userId) {
      try {
        const card = await this._findUsableCard(giftCardCode, userId);
        const amount = usable(card.balance, due);
        giftCard = { id: String(card._id), last4: card.last4, balance: card.balance, amount };
        due = money(due - amount);
      } catch (error) {
        if (!lenient || error?.isCreditError !== true) throw error;
        giftCardError = error.message;
      }
    }

    const walletEnabled = config.walletCheckoutEnabled === true;
    const walletBalance = walletEnabled && userId && this.walletService ? money((await this.walletService.getBalance(userId)).balance) : 0;
    const walletAmount = useWallet && walletBalance > 0 ? usable(walletBalance, due) : 0;
    due = money(due - walletAmount);

    return {
      grossTotal: money(total),
      total: due,
      cashback,
      giftCard,
      ...(giftCardError ? { giftCardError } : {}),
      giftCardAmount: giftCard?.amount || 0,
      walletEnabled,
      walletBalance,
      walletAmount,
    };
  }

  // ─── Gift card lookups (guess protection) ─────────────────────────────────

  _badKey(userId) {
    return `giftcard:bad:${userId}`;
  }

  async _assertMayTry(userId) {
    if (!this.redis) return;
    if ((Number(await this.redis.get(this._badKey(userId))) || 0) < MAX_BAD_CODES) return;
    const ttl = Math.max(1, Number(await this.redis.ttl(this._badKey(userId))) || BAD_CODE_WINDOW_SECONDS);
    throw creditError(AppError.rateLimited(`Too many wrong gift card codes. Please try again in ${Math.ceil(ttl / 60)} minutes.`, { retryAfterSeconds: ttl }));
  }

  async _countBad(userId) {
    if (!this.redis) return;
    const n = await this.redis.incr(this._badKey(userId));
    if (n === 1) await this.redis.expire(this._badKey(userId), BAD_CODE_WINDOW_SECONDS);
  }

  async _findUsableCard(code, userId) {
    await this._assertMayTry(userId);
    const clean = cleanCode(code);
    const card = clean.length === CODE_LENGTH ? await GiftCard.findOne({ codeHash: hashCode(clean), deletedAt: null }) : null;
    let mine = Boolean(card && card.isActive);
    if (mine && card.phone) {
      const user = await this.userRepository.findById(userId);
      mine = String(user?.phone || '').replace(/\D/g, '').slice(-10) === card.phone;
    }
    if (!mine) {
      await this._countBad(userId);
      throw invalidCard();
    }
    if (card.expiresAt && card.expiresAt < new Date()) throw creditError(AppError.validation('This gift card has expired'));
    if (!(card.balance > 0)) throw creditError(AppError.validation('This gift card has no balance left'));
    return card;
  }

  // ─── Spending (inside the order transaction) ──────────────────────────────

  async commit({ order, userId, credits }, session) {
    if (!credits) return;
    const orderId = order._id;

    if (credits.giftCard?.amount > 0) {
      const spent = await GiftCard.updateOne(
        { _id: credits.giftCard.id, isActive: true, deletedAt: null, balance: { $gte: credits.giftCard.amount } },
        { $inc: { balance: -credits.giftCard.amount } }
      ).session(session);
      if (spent.matchedCount === 0) throw creditError(AppError.conflict('This gift card no longer has enough balance. Please try again.'));
      await OrderCredit.create([{
        key: `gift:${orderId}`, kind: 'gift_card', orderId, userId, giftCardId: credits.giftCard.id, amount: credits.giftCard.amount,
      }], { session });
    }

    if (credits.walletAmount > 0) {
      await this.walletService.debit({
        userId,
        amount: credits.walletAmount,
        referenceType: WALLET_TX_REFERENCE.ORDER,
        referenceId: orderId,
        description: `Paid for order ${order.orderNumber}`,
        idempotencyKey: `wallet-order:${orderId}`,
        session,
      });
      await OrderCredit.create([{ key: `wallet:${orderId}`, kind: 'wallet', orderId, userId, amount: credits.walletAmount }], { session });
    }

    if (credits.cashback?.amount > 0) await this._takeCashbackSlot({ orderId, userId, cashback: credits.cashback }, session);
  }

  /** One unique slot per allowed use, so parallel orders cannot both take the last one. */
  async _takeCashbackSlot({ orderId, userId, cashback }, session) {
    const config = await this.platformConfigService.getConfig();
    const limit = Math.floor(Number(resolveCashback(config).perCustomer) || 0);
    const base = `cashback:${cashback.campaign}:${userId}`;
    let key = `${base}:order-${orderId}`;
    if (limit > 0) {
      const taken = new Set((await OrderCredit.find({ kind: 'cashback', campaign: cashback.campaign, userId }).session(session).lean()).map((r) => r.key));
      const n = Array.from({ length: limit }, (_, i) => i + 1).find((i) => !taken.has(`${base}:${i}`));
      if (!n) throw creditError(AppError.conflict('You have already used this cashback offer. Please review your order again.'));
      key = `${base}:${n}`;
    }
    try {
      await OrderCredit.create([{ key, kind: 'cashback', orderId, userId, campaign: cashback.campaign, amount: cashback.amount }], { session });
    } catch (error) {
      if (error?.code === 11000) throw creditError(AppError.conflict('You have already used this cashback offer. Please review your order again.'));
      throw error;
    }
  }

  /** Order cancelled or never paid: every credit goes back, exactly once. */
  async releaseForOrder(orderId, session = null) {
    const rows = await OrderCredit.find({ orderId, releasedAt: null }).session(session).lean();
    for (const row of rows) {
      if (row.kind === 'cashback') {
        // eslint-disable-next-line no-await-in-loop
        await OrderCredit.deleteOne({ _id: row._id }).session(session);
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const claimed = await OrderCredit.updateOne({ _id: row._id, releasedAt: null }, { $set: { releasedAt: new Date() } }).session(session);
      if (claimed.modifiedCount !== 1) continue;
      if (row.kind === 'gift_card') {
        // eslint-disable-next-line no-await-in-loop
        await GiftCard.updateOne({ _id: row.giftCardId }, { $inc: { balance: row.amount } }).session(session);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await this.walletService.credit({
          userId: row.userId,
          amount: row.amount,
          referenceType: WALLET_TX_REFERENCE.REFUND,
          referenceId: orderId,
          description: 'Wallet money returned for a cancelled order',
          idempotencyKey: `wallet-return:${orderId}`,
          session,
        });
      }
    }
    if (rows.length) await this.orderRepository.updateById(orderId, { 'cashback.status': 'cancelled' }, session);
  }

  // ─── Wallet cashback after delivery ───────────────────────────────────────

  async creditDelivered(orderId) {
    return withTransaction(async (session) => {
      const order = await this.orderRepository.findById(orderId, { session });
      if (!order || order.status !== 'delivered') return false;
      if (order.cashback?.mode !== 'wallet' || order.cashback?.status !== 'pending' || !(order.cashback.amount > 0)) return false;
      await this.walletService.credit({
        userId: order.userId,
        amount: order.cashback.amount,
        referenceType: WALLET_TX_REFERENCE.PROMOTION,
        referenceId: order._id,
        description: `Cashback for order ${order.orderNumber}`,
        idempotencyKey: `cashback:${order._id}`,
        session,
      });
      await this.orderRepository.updateById(order._id, { 'cashback.status': 'credited', 'cashback.creditedAt': new Date() }, session);
      return true;
    });
  }

  /** Runs creditMissed now and every few minutes; returns the timer. */
  startCatchUp(intervalMs = 5 * 60 * 1000) {
    const run = () => this.creditMissed().catch((err) => logger.error({ err }, 'Cashback catch-up failed'));
    run();
    const timer = setInterval(run, intervalMs);
    timer.unref?.();
    return timer;
  }

  /** Catches deliveries whose event was lost (restart, crash). Safe to run any time. */
  async creditMissed(limit = 200) {
    const due = await this.orderRepository.find(
      { status: 'delivered', 'cashback.mode': 'wallet', 'cashback.status': 'pending' }, { limit }
    );
    let done = 0;
    for (const order of due) {
      // eslint-disable-next-line no-await-in-loop
      if (await this.creditDelivered(order._id).catch(() => false)) done += 1;
    }
    return done;
  }

  /**
   * The share of an order's cashback that belongs to returned goods, so buying,
   * keeping the cashback and returning everything does not pay.
   */
  cashbackShare(order, goodsAmount) {
    const c = order?.cashback;
    if (!c || !(c.amount > 0) || !['applied', 'credited'].includes(c.status)) return 0;
    const base = Number(order.subtotal) || 0;
    return base > 0 ? money(Math.min(c.amount, (c.amount * goodsAmount) / base)) : 0;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  _serializeCard(card) {
    const expired = Boolean(card.expiresAt && card.expiresAt < new Date());
    return {
      id: String(card._id),
      code: `•••• •••• •••• ${card.last4}`,
      initialAmount: card.initialAmount,
      balance: card.balance,
      phone: card.phone,
      note: card.note,
      expiresAt: card.expiresAt,
      isActive: card.isActive,
      status: !card.isActive ? 'frozen' : expired ? 'expired' : card.balance <= 0 ? 'used' : 'active',
      createdAt: card.createdAt,
    };
  }

  async createCards({ amount, quantity = 1, expiresAt = null, phone = null, note = '' }, adminId = null) {
    const out = [];
    for (let i = 0; i < quantity; i += 1) {
      const code = newCode();
      // eslint-disable-next-line no-await-in-loop
      const card = await GiftCard.create({
        codeHash: hashCode(code),
        last4: code.slice(-4),
        initialAmount: amount,
        balance: amount,
        expiresAt,
        phone: phone ? String(phone).replace(/\D/g, '').slice(-10) : null,
        note,
        createdBy: adminId,
      });
      // The only time the code exists outside the customer's hands.
      out.push({ ...this._serializeCard(card), code: formatCode(code) });
    }
    return out;
  }

  async listCards({ page = 1, limit = 30 } = {}) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 30));
    const [rows, total] = await Promise.all([
      GiftCard.find({ deletedAt: null }).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
      GiftCard.countDocuments({ deletedAt: null }),
    ]);
    return { items: rows.map((c) => this._serializeCard(c)), page: p, limit: l, total };
  }

  async setCardActive(id, isActive) {
    const card = await GiftCard.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { isActive } }, { new: true });
    if (!card) throw AppError.notFound('Gift card not found');
    return this._serializeCard(card);
  }

  async cardUses(id) {
    const rows = await OrderCredit.find({ kind: 'gift_card', giftCardId: id }).sort({ createdAt: -1 }).limit(100).lean();
    return rows.map((r) => ({ orderId: String(r.orderId), userId: String(r.userId), amount: r.amount, at: r.createdAt, returnedAt: r.releasedAt }));
  }
}

module.exports = { OrderCreditsService, hashCode, cleanCode, usable };
