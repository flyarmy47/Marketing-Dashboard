import { useState } from 'react';
import { METRIC_DEFS } from './MetricGrid';

const ALL_METRICS = Object.keys(METRIC_DEFS);

export default function TileConfigurator({ tileConfig, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set(tileConfig));

  const toggle = (key) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
  };

  const handleSave = () => {
    onSave(ALL_METRICS.filter((m) => selected.has(m)));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Configure Metrics</h2>
        <p className="mt-1 text-sm text-gray-500">Select which metrics to display on your dashboard.</p>

        <div className="mt-4 space-y-2">
          {ALL_METRICS.map((key) => (
            <label key={key} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggle(key)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{METRIC_DEFS[key].label}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
