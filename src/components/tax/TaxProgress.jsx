import { formatKwacha } from '../../utils/format';

const TONES = {
  below: { bar: 'bg-brand', text: 'Below threshold' },
  approaching: { bar: 'bg-accent', text: 'Approaching threshold' },
  above: { bar: 'bg-danger', text: 'Above threshold' },
};

/** Progress toward the (placeholder) VAT threshold. */
export default function TaxProgress({ vat }) {
  const tone = TONES[vat.status];
  const pct = Math.min(vat.percent, 100);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-2xl font-extrabold tabular-nums">{Math.round(vat.percent)}%</p>
        <p className="text-[13px] font-semibold text-ink-muted">{tone.text}</p>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-brand-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress toward the illustrative VAT threshold">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(pct, 1)}%` }} />
        <span className="absolute -top-1 bottom-[-4px] w-px bg-ink/40" style={{ left: '75%' }} aria-hidden="true" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-ink-muted">
        <span>K0</span>
        <span style={{ marginLeft: '25%' }}>75% watch point</span>
        <span>{formatKwacha(vat.threshold)}</span>
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        Projected annual turnover is <span className="font-bold text-ink">{formatKwacha(vat.annualisedTurnover)}</span>.
        {vat.remaining > 0 ? <> About <span className="font-bold text-ink">{formatKwacha(vat.remaining)}</span> remains before the placeholder threshold.</> : ' It is above the placeholder threshold.'}
      </p>
    </div>
  );
}
