import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const DEFAULT_TILES = ['impressions', 'clicks', 'spend', 'conversions', 'ctr', 'cpa', 'roi'];

export default function useDashboard({ dateRange }) {
  const [metrics, setMetrics] = useState(null);
  const [tileConfig, setTileConfig] = useState(DEFAULT_TILES);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      const [metricsData, configData] = await Promise.all([
        apiFetch(`dashboard/metrics?${params}`),
        apiFetch('dashboard/config'),
      ]);
      setMetrics(metricsData);
      if (configData?.tileConfig) {
        setTileConfig(configData.tileConfig);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const saveTileConfig = async (config) => {
    setTileConfig(config);
    await apiFetch('dashboard/config', {
      method: 'PUT',
      body: JSON.stringify({ tileConfig: config }),
    });
  };

  return { metrics, tileConfig, saveTileConfig, loading };
}
