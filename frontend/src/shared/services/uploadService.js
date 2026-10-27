import { customerApi } from '../api/client';

/**
 * Upload a file to CMS storage and return the public URL path.
 */
export async function uploadCmsImage(file) {
  if (!file) throw new Error('No file selected');

  const presign = await customerApi.post('/uploads/presign', {
    context: 'cms',
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
    throw new Error('Image upload failed. Please try again.');
  }

  const confirmed = await customerApi.post('/uploads/confirm', {
    context: 'cms',
    storageKey: presign.storageKey,
    mimeType: file.type,
  });

  return confirmed.url;
}

/**
 * Upload a media file (image/video) for product reviews.
 */
export async function uploadReviewMedia(file) {
  if (!file) throw new Error('No file selected');

  const presign = await customerApi.post('/uploads/presign', {
    context: 'reviews',
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
    throw new Error('Media upload failed. Please try again.');
  }

  const confirmed = await customerApi.post('/uploads/confirm', {
    context: 'reviews',
    storageKey: presign.storageKey,
    mimeType: file.type,
  });

  return confirmed.url;
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

