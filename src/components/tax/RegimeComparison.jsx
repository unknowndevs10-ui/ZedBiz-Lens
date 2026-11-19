import Badge from '../common/Badge';
import { formatKwacha } from '../../utils/format';

function amountLabel(r) {
  if (!r.applicable) return 'Not shown';
  return r.annualLow === r.annualHigh ? formatKwacha(r.annualLow) : `${formatKwacha(r.annualLow)} – ${formatKwacha(r.annualHigh)}`;
}

export default function RegimeComparison({ regimes, lowestId }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
      {regimes.map((r) => (
        <div key={r.id} className={`flex flex-col bg-white p-4 sm:p-5 ${r.applicable ? '' : 'opacity-70'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold">{r.name}</h3>
            {lowestId === r.id && <Badge tone="brand">Lowest in this demo</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">{r.basis}</p>
          <p className="mt-4 text-[13px] font-semibold text-ink-muted">Annual estimate</p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums">{amountLabel(r)}</p>
          <dl className="mt-3 space-y-1 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Rate</dt><dd className="text-right font-semibold">{r.rateLabel}</dd></div>
          </dl>
          <p className="mt-3 text-[13px] text-ink-muted">{r.note}</p>
        </div>
      ))}
    </div>
  );
}
