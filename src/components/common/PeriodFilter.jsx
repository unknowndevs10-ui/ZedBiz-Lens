import { PERIODS } from '../../utils/finance';

export default function PeriodFilter({ value, onChange, label = 'Time period' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-white p-0.5 shadow-card">
      {PERIODS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.id)}
            className={`h-9 rounded px-3 text-[13px] font-semibold transition-colors focus-ring ${active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
