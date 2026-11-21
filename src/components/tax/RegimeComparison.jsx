import { formatKwacha } from '../../utils/format';

export default function RegimeComparison({ regimes }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
      {regimes.map((regime) => (
        <div key={regime.id} className="flex flex-col bg-[#121a1b] p-4 sm:p-5">
          <h3 className="text-[15px] font-bold">{regime.name}</h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">{regime.basis}</p>
          <p className="mt-4 text-[13px] font-semibold text-ink-muted">{regime.estimateTitle || 'Estimate'}</p>
          {regime.scenarios ? (
            <dl className="mt-1 space-y-1.5 text-[13px]">
              {regime.scenarios.map((scenario) => (
                <div key={scenario.label} className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{scenario.label}</dt>
                  <dd className="text-right font-bold tabular-nums">{formatKwacha(scenario.amount)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-1 text-base font-bold text-ink-muted">Not calculated</p>
          )}
          <dl className="mt-3 space-y-1 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Rate</dt><dd className="text-right font-semibold">{regime.rateLabel}</dd></div>
          </dl>
          <p className="mt-3 text-[13px] text-ink-muted">{regime.note}</p>
        </div>
      ))}
    </div>
  );
}

