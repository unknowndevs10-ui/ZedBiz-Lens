import { formatKwacha, formatPercent } from '../../utils/format';

export default function CategoryBreakdown({ items }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-ink-muted">No expenses in this period.</p>;
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={item.category}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{item.category}</span>
            <span className="tabular-nums text-ink-muted">
              <span className="font-bold text-ink">{formatKwacha(item.amount)}</span> · {formatPercent(item.share, 0)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-100" role="meter" aria-label={`${item.category} share of expenses`} aria-valuenow={Math.round(item.share)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-brand'}`} style={{ width: `${Math.max(item.share, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
