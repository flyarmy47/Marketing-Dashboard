import MetricTile from './MetricTile';

const METRIC_DEFS = {
  impressions: { label: 'Impressions', format: 'number' },
  clicks: { label: 'Clicks', format: 'number' },
  spend: { label: 'Budget Spent', format: 'currency' },
  budget: { label: 'Total Budget', format: 'currency' },
  conversions: { label: 'Conversions', format: 'number' },
  reach: { label: 'Reach', format: 'number' },
  video_views: { label: 'Video Views', format: 'number' },
  ctr: { label: 'CTR', format: 'percent' },
  cpa: { label: 'CPA', format: 'currency' },
  cpm: { label: 'CPM', format: 'currency' },
  roi: { label: 'ROI', format: 'percent' },
  frequency: { label: 'Frequency', format: 'number' },
};

export default function MetricGrid({ tileConfig, current, previous }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {tileConfig.map((key) => {
        const def = METRIC_DEFS[key];
        if (!def) return null;
        return (
          <MetricTile
            key={key}
            label={def.label}
            value={current?.[key] ?? 0}
            previousValue={previous?.[key]}
            format={def.format}
          />
        );
      })}
    </div>
  );
}

export { METRIC_DEFS };
