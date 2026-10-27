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
 * Upload an avatar/profile image.
 */
export async function uploadAvatar(file) {
  if (!file) throw new Error('No file selected');

  const mimeType = file.type || 'image/jpeg';
  const fileName = file.name || 'avatar.jpg';

  const presign = await customerApi.post('/uploads/presign', {
    context: 'avatars',
    fileName,
    mimeType,
  });

  const uploadTarget = presign?.uploadUrl || presign?.url;
  if (!uploadTarget) {
    throw new Error('Presigned upload URL was not generated.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const uploadResponse = await fetch(uploadTarget, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Avatar upload failed. Please try again.');
  }

  const confirmed = await customerApi.post('/uploads/confirm', {
    context: 'avatars',
    storageKey: presign.storageKey,
    mimeType,
  });

  return confirmed?.url || confirmed?.storageKey;
}

/**
 * Upload a product image / video (used by the seller bulk upload).
 */
export function uploadProductMedia(file) {
  return uploadToContext(file, 'products', `Upload failed for ${file?.name || 'file'}.`);
}
