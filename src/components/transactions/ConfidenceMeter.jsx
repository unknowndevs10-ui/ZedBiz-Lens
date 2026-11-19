const levelFor = (value) => (value >= 0.85 ? { label: 'High', bar: 'bg-success' } : value >= 0.7 ? { label: 'Medium', bar: 'bg-brand' } : { label: 'Low', bar: 'bg-accent' });

/** Shows the extraction confidence as a bar plus words, so colour is never the only cue. */
export default function ConfidenceMeter({ value }) {
  if (value === null || value === undefined) return null;
  const { label, bar } = levelFor(value);
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2" title="Simulated confidence for the demo">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-100" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Extraction confidence">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink-muted">{label} · {pct}%</span>
    </div>
  );
}
