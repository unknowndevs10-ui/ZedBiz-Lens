import { TrendingDown, TrendingUp } from 'lucide-react';

/** `delta` is a percentage (or percentage points when deltaUnit="pp"); null hides it. */
export default function StatCard({ label, value, delta = null, deltaUnit = '%', goodWhenUp = true, className = '', emphasis = false }) {
  let deltaEl = null;
  if (delta !== null && delta !== undefined && Number.isFinite(delta)) {
    const up = delta >= 0;
    const good = up === goodWhenUp;
    const Icon = up ? TrendingUp : TrendingDown;
    deltaEl = (
      <p className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${Math.abs(delta) < 0.05 ? 'text-ink-muted' : good ? 'text-success' : 'text-danger'}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{Math.abs(delta) > 999 ? (up ? '>+999' : '<-999') : `${up ? '+' : ''}${delta.toFixed(1)}`}{deltaUnit === 'pp' ? ' pts' : '%'}</span>
        <span className="font-medium text-ink-muted">vs previous period</span>
      </p>
    );
  }
  return (
    <div className={`bg-white p-4 sm:p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
      <p className={`mt-1.5 truncate font-extrabold tabular-nums tracking-tight ${emphasis ? 'text-2xl' : 'text-xl'}`}>{value}</p>
      {deltaEl}
    </div>
  );
}
