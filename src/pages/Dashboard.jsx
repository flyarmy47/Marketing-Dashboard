import { useState } from 'react';
import { format, subDays } from 'date-fns';
import DateRangePicker from '../components/DateRangePicker';
import MetricGrid from '../components/MetricGrid';
import TileConfigurator from '../components/TileConfigurator';
import LoadingSpinner from '../components/LoadingSpinner';
import useDashboard from '../hooks/useDashboard';

const today = format(new Date(), 'yyyy-MM-dd');
const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({ start: weekAgo, end: today });
  const [showConfigurator, setShowConfigurator] = useState(false);

  const { metrics, tileConfig, saveTileConfig, loading } = useDashboard({ dateRange });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Your ad performance at a glance</p>
        </div>
        <button
          onClick={() => setShowConfigurator(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Configure
        </button>
      </div>

      <div className="mt-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="mt-6">
          <MetricGrid
            tileConfig={tileConfig}
            current={metrics?.current}
            previous={metrics?.previous}
          />
        </div>
      )}

      {showConfigurator && (
        <TileConfigurator
          tileConfig={tileConfig}
          onSave={saveTileConfig}
          onClose={() => setShowConfigurator(false)}
        />
      )}
    </div>
  );
}
