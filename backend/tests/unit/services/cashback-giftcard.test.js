const { computeCashback, publicCashback } = require('../../../src/services/pricing/cashback');
const { hashCode, cleanCode, usable } = require('../../../src/services/pricing/OrderCreditsService');

const cfg = (over = {}) => ({ cashbackConfig: { enabled: true, mode: 'instant', type: 'percent', value: 10, maxAmount: 100, minOrder: 199, methods: ['upi'], tabs: [], perCustomer: 1, ...over } });

describe('P58 cashback rules come from admin', () => {
  it('percent capped by maximum, only on chosen methods, from the minimum order', () => {
    expect(computeCashback(cfg(), { value: 2000, marketplaceTab: 'mithilakart', paymentMethod: 'upi' }).amount).toBe(100);
    expect(computeCashback(cfg(), { value: 500, marketplaceTab: 'mithilakart', paymentMethod: 'upi' }).amount).toBe(50);
    expect(computeCashback(cfg(), { value: 500, marketplaceTab: 'mithilakart', paymentMethod: 'cod' }).amount).toBe(0);
    const low = computeCashback(cfg(), { value: 150, marketplaceTab: 'mithilakart', paymentMethod: 'upi' });
    expect(low.amount).toBe(0);
    expect(low.amountNeeded).toBe(49);
  });

  it('respects tabs, dates, per-customer uses and the off switch', () => {
    expect(computeCashback(cfg({ tabs: ['quick_shop'] }), { value: 500, marketplaceTab: 'mithilak', paymentMethod: 'upi' }).amount).toBe(0);
    expect(computeCashback(cfg({ endsAt: '2000-01-01' }), { value: 500, paymentMethod: 'upi' }).amount).toBe(0);
    expect(computeCashback(cfg(), { value: 500, paymentMethod: 'upi', usesLeft: 0 }).amount).toBe(0);
    expect(computeCashback(cfg({ enabled: false }), { value: 500, paymentMethod: 'upi' }).amount).toBe(0);
    expect(computeCashback(cfg({ type: 'flat', value: 30 }), { value: 20, paymentMethod: 'upi', minOrder: 0 }).amount).toBe(0);
  });

  it('banner and Know More are written from the rules; off means nothing shown', () => {
    const p = publicCashback(cfg());
    expect(p.title).toBe('Get up to ₹100 cashback on UPI');
    expect(p.rules).toEqual(expect.arrayContaining(['Order items worth ₹199 or more.', 'Pay with UPI.', 'Up to 1 time per customer.']));
    expect(publicCashback(cfg({ enabled: false }))).toEqual({ enabled: false });
  });
});

describe('gift card helpers', () => {
  it('hashes the cleaned code, never the raw text', () => {
    expect(cleanCode('abcd-efgh ijkm-npqr')).toBe('ABCDEFGHIJKMNPQR');
    expect(hashCode('abcd-efgh-ijkm-npqr')).toBe(hashCode('ABCDEFGHIJKMNPQR'));
    expect(hashCode('ABCDEFGHIJKMNPQR')).not.toContain('ABCD');
  });

  it('never leaves an amount below ₹1 for the payment gateway', () => {
    expect(usable(100, 300)).toBe(100);
    expect(usable(500, 300)).toBe(300);
    expect(usable(299.5, 300)).toBe(299);
  });
});
