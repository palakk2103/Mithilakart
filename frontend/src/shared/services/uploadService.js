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
