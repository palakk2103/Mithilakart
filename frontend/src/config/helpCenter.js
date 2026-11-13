/** Help & Support page content — customer + admin API helpers. */
import customerApi, { adminApiClient } from '../shared/api/client';

/** Customer: returns { isCustom, contactMethods, faqs, contactSection } or null on failure. */
export const fetchHelpCenter = async () => {
  try {
    const res = await customerApi.get('/storefront/help-center');
    if (!res || !Array.isArray(res.faqs) || !Array.isArray(res.contactMethods)) return null;
    return res;
  } catch {
    return null;
  }
};

/** Admin: returns { content, isCustom }. */
export const getAdminHelpCenter = async () => adminApiClient.get('/settings/help-center');

/** Admin: pass `null` to reset to built-in defaults. */
export const saveAdminHelpCenter = async (content) => adminApiClient.put('/settings/help-center', { content });
