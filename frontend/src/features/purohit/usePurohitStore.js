import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSeedState, DEFAULT_SETTINGS, PUROHIT_SCHEMA_VERSION, SEED_RITUALS, SEED_PANDITS, SEED_SERVICES } from './purohitSeed';

/**
 * Purohit & Ritual Services catalogue — FRONTEND ONLY.
 *
 * Data is kept in this browser's localStorage (key below). It is NOT saved on the server:
 * other devices/browsers will not see admin edits until a backend is connected.
 *
 * Backend integration later: keep the shape (settings / rituals / pandits / services) and
 * swap the bodies of the actions below for API calls (or hydrate the store from an API and
 * drop `persist`). Components only talk to these actions + the selectors in ./selectors.js.
 *
 * Model
 *  - ritual   : a puja category (Satyanarayan, Vivah…)
 *  - pandit   : one record per person, never duplicated per ritual
 *  - service  : a listing = pandit × ritual with its own price. One pandit can have many
 *               services (one per ritual), each priced independently.
 */

export const PUROHIT_STORAGE_KEY = 'mk_purohit_catalog_v1';
export const PUROHIT_STORAGE_ERROR_EVENT = 'purohit-storage-error';

export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// localStorage wrapper: a full quota (large uploaded images) must not crash the app.
const safeStorage = {
  getItem: (name) => {
    try { return localStorage.getItem(name); } catch { return null; }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      window.dispatchEvent(new CustomEvent(PUROHIT_STORAGE_ERROR_EVENT, { detail: err }));
    }
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name); } catch { /* ignore */ }
  },
};

const sortByOrder = (list, key) => [...list].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
const renumber = (list, key) => list.map((item, i) => ({ ...item, [key]: i + 1 }));

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const optionalAmount = (v) => (v === '' || v === null || v === undefined ? null : Math.max(0, toNumber(v)));

const cleanService = (svc) => ({
  ...svc,
  price: Math.max(0, toNumber(svc.price)),
  mrp: optionalAmount(svc.mrp),
  travelCharge: optionalAmount(svc.travelCharge),
  samagriPrice: optionalAmount(svc.samagriPrice),
});

const usePurohitStore = create(
  persist(
    (set, get) => ({
      ...createSeedState(),

      /* ---------- Section settings ---------- */
      updateSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),

      /* ---------- Rituals ---------- */
      /** Create or update. A given `order` (1-based) moves the ritual to that position. */
      saveRitual: (ritual) => {
        const st = get();
        const exists = ritual.id && st.rituals.some((x) => x.id === ritual.id);
        const id = exists ? ritual.id : (ritual.id || newId('ritual'));
        const { order, ...rest } = ritual;
        const list = sortByOrder(st.rituals, 'order');
        const current = exists ? list.find((x) => x.id === id) : null;
        const record = exists
          ? { ...current, ...rest }
          : { image: '', description: '', active: true, featured: false, posterTemplateImage: '', artPalette: st.rituals.length, ...rest, id };
        const others = list.filter((x) => x.id !== id);
        const hasOrder = order !== undefined && order !== null && order !== '';
        const index = hasOrder
          ? Math.min(Math.max(Number(order) - 1, 0), others.length)
          : (exists ? list.findIndex((x) => x.id === id) : others.length);
        others.splice(index, 0, record);
        set({ rituals: renumber(others, 'order') });
        return id;
      },
      deleteRitual: (id) => set((st) => ({
        rituals: renumber(sortByOrder(st.rituals.filter((x) => x.id !== id), 'order'), 'order'),
        services: st.services.filter((x) => x.ritualId !== id),
      })),
      moveRitual: (id, dir) => set((st) => {
        const list = sortByOrder(st.rituals, 'order');
        const i = list.findIndex((x) => x.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return {};
        [list[i], list[j]] = [list[j], list[i]];
        return { rituals: renumber(list, 'order') };
      }),

      /* ---------- Pandits ---------- */
      /**
       * Save a pandit and (optionally) their ritual assignments in one go.
       * `assignments`: [{ ritualId, price, mrp, duration }] — rituals not listed lose their
       * listing for this pandit; existing listings keep their homepage/featured settings.
       */
      savePandit: (pandit, assignments) => {
        const st = get();
        const exists = pandit.id && st.pandits.some((x) => x.id === pandit.id);
        const id = exists ? pandit.id : (pandit.id || newId('pandit'));
        const record = {
          image: '', designation: '', institution: '', available: true, qualifications: '', description: '', verified: false, active: true, isSample: false,
          languages: ['Hindi'], location: '', serviceAreas: [], onlineAvailable: false, workingDays: [0, 1, 2, 3, 4, 5, 6], gallery: [], phone: '',
          ...pandit,
          id,
          experienceYears: Math.max(0, toNumber(pandit.experienceYears)),
          specializations: (pandit.specializations || []).map((x) => String(x).trim()).filter(Boolean),
        };
        const pandits = exists
          ? st.pandits.map((x) => (x.id === id ? { ...x, ...record, isSample: false } : x))
          : [...st.pandits, record];

        let { services } = st;
        if (Array.isArray(assignments)) {
          const wanted = new Map(assignments.map((a) => [a.ritualId, a]));
          const kept = services.filter((svc) => svc.panditId !== id || wanted.has(svc.ritualId));
          services = kept.map((svc) => {
            if (svc.panditId !== id) return svc;
            const a = wanted.get(svc.ritualId);
            return cleanService({ ...svc, price: a.price, mrp: a.mrp, duration: a.duration ?? svc.duration, isSample: false });
          });
          assignments.forEach((a) => {
            if (services.some((svc) => svc.panditId === id && svc.ritualId === a.ritualId)) return;
            services.push(cleanService({
              id: newId('svc'), panditId: id, ritualId: a.ritualId, price: a.price, mrp: a.mrp,
              duration: a.duration || '', note: '', active: true, featured: false, showOnHome: false, homeOrder: 0,
              badgeLine1: '', badgeLine2: '', templateImage: '', inPerson: true, online: false, travelCharge: null, samagriPrice: null, isSample: false,
            }));
          });
        }
        set({ pandits, services });
        return id;
      },
      deletePandit: (id) => set((st) => ({
        pandits: st.pandits.filter((x) => x.id !== id),
        services: st.services.filter((x) => x.panditId !== id),
      })),
      updatePandit: (id, patch) => set((st) => ({ pandits: st.pandits.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      /* ---------- Services (pandit × ritual listings) ---------- */
      /**
       * Create or update a pandit card (service listing) with all its poster fields.
       * Returns { ok: false, reason } when the pandit already has a card for that ritual.
       */
      saveService: (card) => {
        const st = get();
        const clash = st.services.some((x) => x.id !== card.id && x.panditId === card.panditId && x.ritualId === card.ritualId);
        if (clash) return { ok: false, reason: 'duplicate' };
        const exists = card.id && st.services.some((x) => x.id === card.id);
        if (exists) {
          const prev = st.services.find((x) => x.id === card.id);
          let services = st.services.map((x) => (x.id === card.id ? cleanService({ ...x, ...card, isSample: false }) : x));
          if (card.showOnHome && !prev.showOnHome) {
            const max = services.reduce((m, x) => (x.showOnHome && x.id !== card.id ? Math.max(m, x.homeOrder || 0) : m), 0);
            services = services.map((x) => (x.id === card.id ? { ...x, homeOrder: max + 1 } : x));
          }
          set({ services });
          return { ok: true, id: card.id };
        }
        const id = newId('svc');
        const max = st.services.reduce((m, x) => (x.showOnHome ? Math.max(m, x.homeOrder || 0) : m), 0);
        set({
          services: [...st.services, cleanService({
            duration: '', note: '', active: true, featured: false, showOnHome: false,
            badgeLine1: '', badgeLine2: '', templateImage: '', inPerson: true, online: false, travelCharge: null, samagriPrice: null,
            ...card, id, homeOrder: card.showOnHome ? max + 1 : 0, isSample: false,
          })],
        });
        return { ok: true, id };
      },
      updateService: (id, patch) => set((st) => {
        let services = st.services.map((x) => (x.id === id ? cleanService({ ...x, ...patch }) : x));
        // Joining the homepage row puts the listing at the end of it.
        if (patch.showOnHome === true) {
          const max = services.reduce((m, x) => (x.showOnHome && x.id !== id ? Math.max(m, x.homeOrder || 0) : m), 0);
          services = services.map((x) => (x.id === id ? { ...x, homeOrder: max + 1 } : x));
        }
        return { services };
      }),
      deleteService: (id) => set((st) => ({ services: st.services.filter((x) => x.id !== id) })),
      moveHomeService: (id, dir) => set((st) => {
        const row = sortByOrder(st.services.filter((x) => x.showOnHome), 'homeOrder');
        const i = row.findIndex((x) => x.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= row.length) return {};
        [row[i], row[j]] = [row[j], row[i]];
        const order = new Map(row.map((x, k) => [x.id, k + 1]));
        return { services: st.services.map((x) => (order.has(x.id) ? { ...x, homeOrder: order.get(x.id) } : x)) };
      }),

      /* ---------- Data utilities ---------- */
      removeSampleData: () => set((st) => {
        const samplePandits = new Set(st.pandits.filter((x) => x.isSample).map((x) => x.id));
        return {
          pandits: st.pandits.filter((x) => !samplePandits.has(x.id)),
          services: st.services.filter((x) => !x.isSample && !samplePandits.has(x.panditId)),
        };
      }),
      resetToStarter: () => set(createSeedState()),
    }),
    {
      name: PUROHIT_STORAGE_KEY,
      version: PUROHIT_SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      // v1 → v2: starter rituals/pandits that still have no image get the generated illustrations.
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        let { rituals, pandits, services } = persisted;
        const bySeed = (seeds) => (x) => seeds.find((sd) => sd.id === x.id);
        // v1 → v2: starter rituals/pandits that still have no image get the generated illustrations.
        if (version < 2) {
          const fill = (list, seeds) => (Array.isArray(list) ? list.map((x) => {
            const seed = bySeed(seeds)(x);
            return seed && !x.image ? { ...x, image: seed.image } : x;
          }) : list);
          rituals = fill(rituals, SEED_RITUALS);
          pandits = fill(pandits, SEED_PANDITS);
        }
        // v2 → v3: poster-template fields. Untouched sample pandits get the sample poster
        // texts; everything else just gains the new (empty) fields.
        if (version < 3) {
          const POSTER_PANDIT = ['designation', 'institution', 'available', 'qualifications'];
          if (Array.isArray(pandits)) {
            pandits = pandits.map((x) => {
              const seed = bySeed(SEED_PANDITS)(x);
              if (seed && x.isSample) return { ...x, ...Object.fromEntries(POSTER_PANDIT.map((k) => [k, seed[k]])) };
              return { designation: '', institution: '', available: true, ...x };
            });
          }
          if (Array.isArray(services)) {
            services = services.map((x) => {
              const seed = bySeed(SEED_SERVICES)(x);
              return { badgeLine1: seed?.badgeLine1 || '', badgeLine2: seed?.badgeLine2 || '', templateImage: '', ...x };
            });
          }
          if (Array.isArray(rituals)) rituals = rituals.map((x) => ({ posterTemplateImage: '', ...x }));
        }
        // v3 → v4: booking fields (languages, location, coverage, working days, booking options).
        if (version < 4) {
          const BOOKING_PANDIT = ['languages', 'location', 'serviceAreas', 'onlineAvailable', 'workingDays', 'gallery', 'phone'];
          if (Array.isArray(pandits)) {
            pandits = pandits.map((x) => {
              const seed = bySeed(SEED_PANDITS)(x);
              const base = seed && x.isSample
                ? Object.fromEntries(BOOKING_PANDIT.map((k) => [k, seed[k]]))
                : { languages: ['Hindi'], location: '', serviceAreas: [], onlineAvailable: false, workingDays: [0, 1, 2, 3, 4, 5, 6], gallery: [], phone: '' };
              return { ...base, ...x };
            });
          }
          if (Array.isArray(services)) {
            services = services.map((x) => {
              const seed = bySeed(SEED_SERVICES)(x);
              return {
                inPerson: true, online: seed?.online ?? false, travelCharge: seed?.travelCharge ?? null, samagriPrice: seed?.samagriPrice ?? null, ...x,
              };
            });
          }
        }
        return { ...persisted, rituals, pandits, services };
      },
      partialize: (st) => ({
        schemaVersion: st.schemaVersion,
        settings: st.settings,
        rituals: st.rituals,
        pandits: st.pandits,
        services: st.services,
      }),
      // Guard against partial/corrupted saved data.
      merge: (persisted, current) => {
        const p = persisted && typeof persisted === 'object' ? persisted : {};
        return {
          ...current,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) },
          rituals: Array.isArray(p.rituals) ? p.rituals : current.rituals,
          pandits: Array.isArray(p.pandits) ? p.pandits : current.pandits,
          services: Array.isArray(p.services) ? p.services : current.services,
        };
      },
    },
  ),
);

// Keep other open tabs (e.g. admin in one tab, storefront in another) in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === PUROHIT_STORAGE_KEY) usePurohitStore.persist.rehydrate();
  });
}

export default usePurohitStore;
