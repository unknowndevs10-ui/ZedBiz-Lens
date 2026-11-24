const levelFor = (value) => (value >= 0.85 ? { label: 'High', bar: 'bg-success' } : value >= 0.7 ? { label: 'Medium', bar: 'bg-brand' } : { label: 'Low', bar: 'bg-accent' });

/** Shows a transparent parser heuristic, not a calibrated probability. */
export default function ConfidenceMeter({ value }) {
  if (value === null || value === undefined) return null;
  const { label, bar } = levelFor(value);
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2" title="Rule-based parsing heuristic. Always review the entry.">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-100" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Rule-based parsing match indicator">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink-muted">Rule match: {label}</span>
    </div>
  );
}
