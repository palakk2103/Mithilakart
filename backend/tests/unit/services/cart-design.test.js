const { normalizeCartDesign, DEFAULT_CART_DESIGN, PAGE_SECTIONS } = require('../../../src/constants/cartDesign');
const { AdminPlatformSettingsService } = require('../../../src/services/admin/AdminPlatformSettingsService');
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

describe('normalizeCartDesign', () => {
  it('nothing saved -> the standard look with every section on', () => {
    const d = normalizeCartDesign(undefined);
    expect(d.global).toMatchObject({ headerBg: '', cardRadius: 12, sectionGap: 8, cardPadding: 10, cardShadow: true });
    Object.entries(PAGE_SECTIONS).forEach(([page, keys]) => {
      expect(d.pages[page].sections.map((s) => s.key)).toEqual(keys);
      expect(d.pages[page].sections.every((s) => s.enabled)).toBe(true);
    });
    expect(d).toEqual(normalizeCartDesign(DEFAULT_CART_DESIGN));
  });

  it('keeps the admin order and visibility, appends sections it does not know about, drops unknown ones', () => {
    const d = normalizeCartDesign({
      pages: { cart: { sections: [{ key: 'items' }, { key: 'rails', enabled: false }, { key: 'bogus' }, { key: 'items' }] } },
    });
    const keys = d.pages.cart.sections.map((s) => s.key);
    expect(keys.slice(0, 2)).toEqual(['items', 'rails']);
    expect(keys).toHaveLength(PAGE_SECTIONS.cart.length);
    expect(keys).not.toContain('bogus');
    expect(d.pages.cart.sections[1].enabled).toBe(false);
  });

  it('cleans bad colours / numbers instead of storing them', () => {
    const d = normalizeCartDesign({
      global: { headerBg: 'red; background:url(x)', pageBg: '#FFF9E8', cardRadius: 999, sectionGap: -4, accent: '#1a7f37' },
      tabs: { quick_shop: { headerBg: '#F26522', cardPadding: 14 }, hacker: { headerBg: '#000' } },
    });
    expect(d.global.headerBg).toBe('');
    expect(d.global.pageBg).toBe('#FFF9E8');
    expect(d.global.cardRadius).toBe(32);
    expect(d.global.sectionGap).toBe(0);
    expect(d.tabs).toEqual({ quick_shop: { headerBg: '#F26522', cardPadding: 14 } });
  });

  it('section style: valid colours/numbers/title only', () => {
    const d = normalizeCartDesign({ pages: { payment: { sections: [{ key: 'methods', style: { bg: '#fff', border: 'nope', padding: 99, marginTop: 12, title: '<b>Pay</b>' } }] } } });
    expect(d.pages.payment.sections[0].style).toEqual({ bg: '#fff', padding: 40, marginTop: 12, title: 'bPay/b' });
  });
});

describe('admin validation', () => {
  const svc = new AdminPlatformSettingsService({});
  const bad = (cartDesign) => expect(() => svc._validateCheckoutSettings({ cartDesign })).toThrow();
  it('rejects invalid input', () => {
    bad(null);
    bad({ global: { headerBg: 'blue' } });
    bad({ global: { cardRadius: 100 } });
    bad({ global: { cardShadow: 'yes' } });
    bad({ tabs: { nope: {} } });
    bad({ pages: { checkout: { sections: [] } } });
    bad({ pages: { cart: { sections: [{ key: 'bill' }] } } });
    bad({ pages: { cart: { sections: [{ key: 'items', style: { bg: 'url(x)' } }] } } });
    bad({ pages: { cart: { sections: [{ key: 'items', style: { marginTop: 500 } }] } } });
  });
  it('accepts the defaults and a customised design', () => {
    expect(() => svc._validateCheckoutSettings({ cartDesign: DEFAULT_CART_DESIGN })).not.toThrow();
    expect(() => svc._validateCheckoutSettings({
      cartDesign: {
        global: { headerBg: '#1a7f37', cardRadius: 20, sectionGap: 12, cardShadow: false },
        tabs: { groceries_fresh: { accent: '#D9A21B' } },
        pages: { summary: { sections: [{ key: 'bill', enabled: true, style: { bg: '#fffbe6', padding: 16, title: 'Bill' } }] } },
      },
    })).not.toThrow();
  });
});

describe('public config', () => {
  it('always returns a complete normalised design', async () => {
    const svc = new PlatformConfigService({});
    svc.getConfig = async () => ({ ...DEFAULT_PLATFORM_SETTINGS, cartDesign: { global: { headerBg: '#123456' } } });
    const cfg = await svc.getPublicConfig();
    expect(cfg.cartDesign.global.headerBg).toBe('#123456');
    expect(cfg.cartDesign.pages.summary.sections).toHaveLength(PAGE_SECTIONS.summary.length);
  });
});
