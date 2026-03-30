import clsx from 'clsx';

const formatters = {
  currency: (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  percent: (v) => `${Number(v).toFixed(2)}%`,
  number: (v) => Number(v).toLocaleString(),
};

export default function MetricTile({ label, value, previousValue, format = 'number' }) {
  const formatter = formatters[format] || formatters.number;
  const formattedValue = formatter(value ?? 0);

  let delta = null;
  if (previousValue != null && previousValue !== 0) {
    delta = ((value - previousValue) / previousValue) * 100;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{formattedValue}</p>
      {delta !== null && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={clsx(
              'text-sm font-medium',
              delta >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {delta >= 0 ? '\u2191' : '\u2193'} {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs prev period</span>
        </div>
      )}
    </div>
  );
}
