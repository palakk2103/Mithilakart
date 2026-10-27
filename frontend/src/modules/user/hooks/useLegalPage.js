import { useEffect, useState } from 'react';
import { getLegalPage } from '../services/storefrontApi';

// In-memory cache for legal pages to provide instant 0ms transitions
const memoryCache = new Map();

function getCachedPage(type) {
  if (memoryCache.has(type)) {
    return memoryCache.get(type);
  }
  try {
    const raw = sessionStorage.getItem(`mk_legal_page_${type}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(type, parsed);
      return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function setCachedPage(type, data) {
  if (!data) return;
  memoryCache.set(type, data);
  try {
    sessionStorage.setItem(`mk_legal_page_${type}`, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export default function useLegalPage(type) {
  const cached = getCachedPage(type);
  const [page, setPage] = useState(() => cached);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // If no cached copy exists, show loading state
      if (!getCachedPage(type)) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await getLegalPage(type);
        if (!cancelled && data) {
          setPage(data);
          setCachedPage(type, data);
        }
      } catch (err) {
        if (!cancelled && !getCachedPage(type)) {
          setError(err.message || 'Failed to load page');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { page, loading, error };
}
