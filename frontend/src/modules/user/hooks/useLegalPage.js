import { useEffect, useState } from 'react';
import { getLegalPage } from '../services/storefrontApi';

export default function useLegalPage(type) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLegalPage(type);
        if (!cancelled) setPage(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load page');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { page, loading, error };
}
