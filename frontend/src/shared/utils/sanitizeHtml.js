/**
 * Keeps admin-authored rich text to safe formatting before it is rendered with
 * dangerouslySetInnerHTML: no scripts, iframes, forms, event handlers or
 * javascript: links. Unknown tags are unwrapped (their text is kept).
 */
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span', 'section',
  'strong', 'b', 'em', 'i', 'u', 's', 'small', 'mark', 'sub', 'sup', 'blockquote', 'code', 'pre',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
]);
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'svg', 'math', 'template', 'noscript']);
const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'class', 'title', 'alt', 'src', 'colspan', 'rowspan']);
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function clean(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 8) { child.remove(); continue; } // comments
    if (child.nodeType !== 1) continue;
    const tag = child.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) { child.remove(); continue; }
    clean(child);
    if (!ALLOWED_TAGS.has(tag)) { child.replaceWith(...child.childNodes); continue; }
    for (const attr of [...child.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      const urlAttr = name === 'href' || name === 'src';
      if (!ALLOWED_ATTRS.has(name) || (urlAttr && !SAFE_URL.test(value))) child.removeAttribute(attr.name);
    }
    if (tag === 'a' && child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer');
  }
}

export default function sanitizeHtml(html) {
  if (!html || typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  clean(doc.body);
  return doc.body.innerHTML;
}
