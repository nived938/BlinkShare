import React from 'react';
import { Clock } from 'lucide-react';

interface ExpirationSelectorProps {
  value: number; // in seconds (60 to 300)
  onChange: (seconds: number) => void;
  className?: string;
}

export const ExpirationSelector: React.FC<ExpirationSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const presets = [
    { label: '1m', seconds: 60, desc: 'Ultra-ephemeral' },
    { label: '2m', seconds: 120, desc: 'Quick drop' },
    { label: '3m', seconds: 180, desc: 'Standard brief' },
    { label: '4m', seconds: 240, desc: 'Extended read' },
    { label: '5m', seconds: 300, desc: 'Full window (Max)' },
  ];

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (s === 0) return `${mins} min${mins > 1 ? 's' : ''}`;
    return `${mins}m ${s}s`;
  };

  return (
    <div className={`p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Clock className="w-4 h-4 text-white" />
          <span>Self-Destruct Lifetime</span>
          <span className="text-[10px] text-black bg-white px-1.5 py-0.2 rounded font-bold">
            1m to 5m
          </span>
        </label>
        <span className="text-xs font-mono font-bold text-white bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg">
          {formatDuration(value)} ({value}s)
        </span>
      </div>

      {/* Quick 1-to-5 minute preset buttons */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {presets.map((preset) => (
          <button
            key={preset.seconds}
            type="button"
            onClick={() => onChange(preset.seconds)}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              value === preset.seconds
                ? 'bg-white text-black shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
            title={preset.desc}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Fine-grained slider from 60s to 300s */}
      <div className="space-y-1">
        <input
          type="range"
          min={60}
          max={300}
          step={15}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>1 min (60s)</span>
          <span>3 min (180s)</span>
          <span>5 min (300s max)</span>
        </div>
      </div>
    </div>
  );
};
