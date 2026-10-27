import { customerApi } from '../api/client';

/**
 * Presign → upload → confirm for one file; returns the public URL path.
 */
async function uploadToContext(file, context, failureMessage) {
  if (!file) throw new Error('No file selected');

  const presign = await customerApi.post('/uploads/presign', {
    context,
    fileName: file.name,
    mimeType: file.type,
  });

  const formData = new FormData();
  formData.append('file', file);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = new Error(failureMessage);
    error.status = uploadResponse.status;
    throw error;
  }

  const confirmed = await customerApi.post('/uploads/confirm', {
    context,
    storageKey: presign.storageKey,
    mimeType: file.type,
  });

  return confirmed.url;
}

/**
 * Upload a file to CMS storage and return the public URL path.
 */
export function uploadCmsImage(file) {
  return uploadToContext(file, 'cms', 'Image upload failed. Please try again.');
}

/**
 * Upload a media file (image/video) for product reviews.
 */
export function uploadReviewMedia(file) {
  return uploadToContext(file, 'reviews', 'Media upload failed. Please try again.');
}

/**
 * Upload a product image / video (used by the seller bulk upload).
 */
export function uploadProductMedia(file) {
  return uploadToContext(file, 'products', `Upload failed for ${file?.name || 'file'}.`);
}
