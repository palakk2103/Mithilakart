import i18n from '../../i18n';
import { translateMany } from './translateContent';

/**
 * App-wide safety net for the customer app's language selection.
 *
 * Individual components translate through t()/tName(), but anything that slips through
 * (CMS / admin-entered names, tab labels, product & category titles the backend could not
 * localise, toasts, aria-labels, hard-coded strings...) is still plain English in the DOM.
 * This walks the rendered DOM, and for every leftover English string it
 *   1. looks it up in the static locale dictionaries (instant), else
 *   2. translates it through the backend translator (batched + cached),
 * and puts the original back when the user returns to English.
 */

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SELECT', 'OPTION']);
const PORTAL_PREFIXES = ['/admin', '/seller', '/delivery'];
const BRAND_ONLY = /^(mithilakart|mithilak|mithila|mithilakart\.com)$/i;
const UNIT_ONLY = /^[\d\s.,₹%+\-×x/()]*(kg|g|gm|gms|ml|l|ltr|pc|pcs|pack|units?|m|cm|mm)?[\d\s.,]*$/i;

let lang = 'en';
let observer = null;
let started = false;
let timer = null;
let staticMap = new Map(); // lower-cased English text -> localised text
const textRecords = new WeakMap(); // Text node -> { orig, shown }
const attrRecords = new WeakMap(); // Element -> { [attr]: { orig, shown } }
const dirty = new Set();
const failed = new Set();
const pending = new Map(); // english text -> [apply callbacks]

const collect = (en, tr, map) => {
  if (!en || !tr) return;
  Object.keys(en).forEach((k) => {
    const a = en[k];
    const b = tr[k];
    if (a && typeof a === 'object') collect(a, b, map);
    else if (typeof a === 'string' && typeof b === 'string' && !a.includes('{{') && a.trim() && a !== b) {
      map.set(a.trim().toLowerCase(), b);
    }
  });
};

const buildStaticMap = (target) => {
  const map = new Map();
  const en = i18n.getResourceBundle('en', 'common');
  const tr = i18n.getResourceBundle(target, 'common');
  collect(en, tr, map);
  // names dictionary is keyed by the English label itself
  Object.entries(tr?.names || {}).forEach(([k, v]) => {
    if (typeof v === 'string') map.set(k.trim().toLowerCase(), v);
  });
  return map;
};

const isPortal = () => PORTAL_PREFIXES.some((p) => window.location.pathname.startsWith(p));

const shouldTranslate = (s) => {
  if (!s || s.length > 1500) return false;
  if (!/[A-Za-z]{2,}/.test(s)) return false;
  if (BRAND_ONLY.test(s)) return false;
  if (UNIT_ONLY.test(s)) return false;
  if (/^(https?:\/\/|www\.)|@[\w-]+\.\w+|^[\w-]+\.(com|in|png|jpg|jpeg|webp|svg)$/i.test(s)) return false;
  // ids / codes such as ORD-12345, a1b2c3d4e5f6
  if (!/\s/.test(s) && /\d/.test(s) && /[A-Za-z]/.test(s) && s.length > 5) return false;
  return true;
};

const isSkippedElement = (el) => {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName)) return true;
    if (n.isContentEditable) return true;
    if (n.getAttribute && (n.getAttribute('translate') === 'no' || n.classList?.contains('notranslate'))) return true;
  }
  return false;
};

const lookupStatic = (s) => staticMap.get(s.toLowerCase()) || null;

const queueTranslation = (text, apply) => {
  if (failed.has(`${lang}:${text}`)) return;
  const list = pending.get(text) || [];
  list.push(apply);
  pending.set(text, list);
  if (!timer) timer = setTimeout(flushPending, 150);
};

async function flushPending() {
  timer = null;
  if (!pending.size) return;
  const batch = new Map(pending);
  pending.clear();
  const forLang = lang;
  const result = await translateMany([...batch.keys()], forLang);
  if (forLang !== lang) return;
  batch.forEach((applies, text) => {
    const tr = result.get(text);
    if (!tr || tr === text) {
      failed.add(`${forLang}:${text}`);
      return;
    }
    applies.forEach((fn) => fn(tr));
  });
}

const processText = (node) => {
  const value = node.nodeValue;
  const rec = textRecords.get(node);
  if (rec && value === rec.shown) return; // our own write
  if (!value || !value.trim()) return;
  const parent = node.parentElement;
  if (!parent || isSkippedElement(parent)) return;
  const trimmed = value.trim();
  if (!shouldTranslate(trimmed)) return;

  const lead = value.match(/^\s*/)[0];
  const trail = value.match(/\s*$/)[0];
  const apply = (translated) => {
    if (node.nodeValue !== value) return; // changed meanwhile
    const shown = lead + translated + trail;
    textRecords.set(node, { orig: value, shown });
    node.nodeValue = shown;
  };
  const hit = lookupStatic(trimmed);
  if (hit) apply(hit);
  else queueTranslation(trimmed, apply);
};

const processAttrs = (el) => {
  if (isSkippedElement(el) && !['INPUT', 'TEXTAREA'].includes(el.tagName)) return;
  if (el.closest?.('[translate="no"],.notranslate')) return;
  let recs = attrRecords.get(el);
  ATTRS.forEach((attr) => {
    if (!el.hasAttribute(attr)) return;
    const value = el.getAttribute(attr);
    if (recs?.[attr] && recs[attr].shown === value) return;
    const trimmed = (value || '').trim();
    if (!shouldTranslate(trimmed)) return;
    const apply = (translated) => {
      if (el.getAttribute(attr) !== value) return;
      recs = attrRecords.get(el) || {};
      recs[attr] = { orig: value, shown: translated };
      attrRecords.set(el, recs);
      el.setAttribute(attr, translated);
    };
    const hit = lookupStatic(trimmed);
    if (hit) apply(hit);
    else queueTranslation(trimmed, apply);
  });
};

const processTree = (root) => {
  if (!root) return;
  if (root.nodeType === 3) return processText(root);
  if (root.nodeType !== 1) return;
  if (root.parentElement && isSkippedElement(root.parentElement)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  // element itself
  processAttrs(root);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === 3) processText(n);
    else processAttrs(n);
    n = walker.nextNode();
  }
};

const restoreAll = () => {
  const root = document.getElementById('root');
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === 3) {
      const rec = textRecords.get(n);
      if (rec && n.nodeValue === rec.shown) n.nodeValue = rec.orig;
      textRecords.delete(n);
    } else {
      const recs = attrRecords.get(n);
      if (recs) {
        Object.entries(recs).forEach(([attr, r]) => {
          if (n.getAttribute(attr) === r.shown) n.setAttribute(attr, r.orig);
        });
        attrRecords.delete(n);
      }
    }
    n = walker.nextNode();
  }
};

let scheduled = false;
const scheduleDirty = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (lang === 'en' || isPortal()) {
      dirty.clear();
      return;
    }
    const nodes = [...dirty];
    dirty.clear();
    nodes.forEach((n) => {
      if (n.isConnected) processTree(n);
    });
  });
};

const onMutations = (mutations) => {
  if (lang === 'en') return;
  for (const m of mutations) {
    if (m.type === 'childList') m.addedNodes.forEach((n) => dirty.add(n));
    else if (m.type === 'characterData') dirty.add(m.target);
    else if (m.type === 'attributes') dirty.add(m.target);
  }
  if (dirty.size) scheduleDirty();
};

export function setDomTranslationLanguage(next) {
  const target = (next || 'en').split('-')[0].toLowerCase();
  if (typeof document === 'undefined') return;
  if (started && target === lang) return;
  restoreAll();
  pending.clear();
  lang = target;
  if (!started) {
    started = true;
    observer = new MutationObserver(onMutations);
    observer.observe(document.getElementById('root') || document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }
  if (lang === 'en') {
    staticMap = new Map();
    return;
  }
  staticMap = buildStaticMap(lang);
  // let React finish rendering the new language/pages first
  setTimeout(() => {
    if (lang === target && !isPortal()) processTree(document.getElementById('root'));
  }, 50);
}

export default setDomTranslationLanguage;
