import customerApi from '../api/client';

// Translates dynamic (CMS / backend supplied) text through the backend translator
// (POST /translate, cached in Redis + MongoDB). Results are also cached locally.
const memory = new Map();
const LS_PREFIX = 'mk_tr_';

const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + s.length;
};

const readCache = (lang, text) => {
  const key = `${lang}:${hash(text)}`;
  if (memory.has(key)) return memory.get(key);
  try {
    const v = localStorage.getItem(LS_PREFIX + key);
    if (v) { memory.set(key, v); return v; }
  } catch { /* storage unavailable */ }
  return null;
};

const writeCache = (lang, text, value) => {
  const key = `${lang}:${hash(text)}`;
  memory.set(key, value);
  try { localStorage.setItem(LS_PREFIX + key, value); } catch { /* ignore */ }
};

export async function translateText(text, lang) {
  const src = typeof text === 'string' ? text.trim() : '';
  if (!src || !lang || lang === 'en' || !/[A-Za-z]/.test(src)) return text;
  const cached = readCache(lang, src);
  if (cached) return cached;
  try {
    // chunk very long strings to respect the 2000 char API limit
    const parts = src.length > 1800 ? src.match(/[\s\S]{1,1800}(?:\s|$)/g) : [src];
    const out = [];
    for (const part of parts) {
      const res = await customerApi.post('/translate', { text: part.trim(), targetLanguage: lang, sourceLanguage: 'en' });
      out.push(res?.translatedText || part);
    }
    const joined = out.join(' ');
    writeCache(lang, src, joined);
    return joined;
  } catch {
    return text;
  }
}

// Translates many strings with as few requests as possible (POST /translate/batch).
export async function translateMany(texts, lang) {
  const result = new Map();
  const todo = [];
  for (const t of new Set(texts)) {
    const cached = readCache(lang, t);
    if (cached) result.set(t, cached); else todo.push(t);
  }
  for (let i = 0; i < todo.length; i += 100) {
    const chunk = todo.slice(i, i + 100);
    try {
      const res = await customerApi.post('/translate/batch', { texts: chunk, targetLanguage: lang, sourceLanguage: 'en' });
      chunk.forEach((t, idx) => {
        const tr = res?.translations?.[idx] || t;
        result.set(t, tr);
        if (tr !== t) writeCache(lang, t, tr);
      });
    } catch {
      chunk.forEach((t) => result.set(t, t));
    }
  }
  return result;
}

// Translates the text nodes of an HTML string, keeping the markup intact.
export async function translateHtml(html, lang) {
  if (!html || !lang || lang === 'en' || typeof DOMParser === 'undefined') return html;
  const doc = new DOMParser().parseFromString('<div id="r">' + html + '</div>', 'text/html');
  const root = doc.getElementById('r');
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeValue && /[A-Za-z]{2,}/.test(n.nodeValue)) nodes.push(n);
  }
  const map = await translateMany(nodes.map((n) => n.nodeValue.trim().slice(0, 2000)), lang);
  nodes.forEach((n) => {
    const lead = n.nodeValue.match(/^\s*/)[0];
    const trail = n.nodeValue.match(/\s*$/)[0];
    n.nodeValue = lead + (map.get(n.nodeValue.trim().slice(0, 2000)) || n.nodeValue.trim()) + trail;
  });
  return root.innerHTML;
}

export default translateText;
