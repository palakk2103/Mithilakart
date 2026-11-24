/**
 * Reads an image file chosen by the admin and returns a compressed data URL.
 * Kept frontend-only (no upload endpoint call); images are resized so localStorage
 * doesn't fill up. When a backend exists, swap this for the CMS upload service.
 *
 * Images that can carry transparency (PNG / WebP / GIF / SVG) keep it — exported as WebP
 * (falls back to PNG where WebP encoding isn't supported) — so deity/altar cut-outs blend
 * into the pandit poster. Photos (JPEG etc.) are exported as JPEG on white.
 */
const MAY_HAVE_ALPHA = /^image\/(png|webp|gif|svg\+xml)$/i;

export const fileToCompressedDataUrl = (file, { maxSize = 640, quality = 0.82 } = {}) => new Promise((resolve, reject) => {
  if (!file) { reject(new Error('No file selected')); return; }
  if (!/^image\//.test(file.type)) { reject(new Error('Please choose an image file')); return; }
  const keepAlpha = MAY_HAVE_ALPHA.test(file.type);
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read the image'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('Unsupported image'));
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width || maxSize, img.height || maxSize));
      const w = Math.max(1, Math.round((img.width || maxSize) * scale));
      const h = Math.max(1, Math.round((img.height || maxSize) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!keepAlpha) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(keepAlpha ? canvas.toDataURL('image/webp', quality) : canvas.toDataURL('image/jpeg', quality));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
