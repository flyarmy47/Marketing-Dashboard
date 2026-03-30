import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function useConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await apiFetch('connections');
      setConnections(data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const remove = async (connectionId) => {
    await apiFetch(`connections/${connectionId}`, { method: 'DELETE' });
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  return { connections, loading, remove, refetch: fetchConnections };
}
