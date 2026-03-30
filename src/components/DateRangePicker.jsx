import { useState } from 'react';
import { subDays, format } from 'date-fns';
import clsx from 'clsx';

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

export default function DateRangePicker({ value, onChange }) {
  const [activePreset, setActivePreset] = useState('7d');

  const handlePreset = (preset) => {
    setActivePreset(preset.label);
    const end = new Date();
    const start = subDays(end, preset.days);
    onChange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
  };

  const handleCustom = (field, val) => {
    setActivePreset(null);
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handlePreset(preset)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            activePreset === preset.label
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          {preset.label}
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={value.start}
          onChange={(e) => handleCustom('start', e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          value={value.end}
          onChange={(e) => handleCustom('end', e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
