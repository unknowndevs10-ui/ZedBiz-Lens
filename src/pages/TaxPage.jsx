import { ChevronDown, Download, Landmark } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import Notification from '../components/common/Notification';
import { ErrorState, LoadingState } from '../components/common/States';
import TaxProgress from '../components/tax/TaxProgress';
import RegimeComparison from '../components/tax/RegimeComparison';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { insightsService } from '../services/insightsService';
import { downloadTaxReport } from '../services/reportService';
import { formatDate, formatKwacha } from '../utils/format';

export default function TaxPage() {
  const { businessId, business, version } = useData();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const { data, loading, error, reload } = useAsync(() => insightsService.getTaxPosition({ businessId }), [businessId, version]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const filename = await downloadTaxReport({ businessId });
      toast(`${filename || 'Tax position report'} downloaded.`, { title: 'Report ready' });
    } catch (err) {
      toast(err.message || 'The report could not be created.', { tone: 'danger', title: 'Download failed' });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tax position</h1>
          <p className="mt-1 text-sm text-ink-muted">{business?.name} · Illustrative view</p>
        </div>
        <Button variant="secondary" icon={Download} loading={downloading} onClick={handleDownload}>Download tax position report</Button>
      </header>

      <Notification tone="warning" className="mt-5" title="Demonstration estimates">
        {data?.disclaimer || 'Illustrative demonstration only. Figures are placeholders pending Finance team approval, not official rates or tax advice.'}
      </Notification>

      {!data && loading ? (
        <LoadingState label="Loading tax position" />
      ) : error ? (
        <Card className="mt-6"><ErrorState title="We could not load the tax position" description={error.message} onRetry={reload} /></Card>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader
                title="Current tax position"
                description={`Based on ${data.basis.transactionCount} confirmed entries from ${formatDate(data.basis.start)} to ${formatDate(data.basis.end)}`}
                action={<Badge tone="amber">Illustrative</Badge>}
              />
              <dl className="grid gap-px bg-line p-px sm:grid-cols-3 mt-4 border-t border-line">
                <div className="bg-white p-4 sm:p-5">
                  <dt className="text-[13px] font-semibold text-ink-muted">Turnover, last {data.basis.days} days</dt>
                  <dd className="mt-1.5 text-xl font-extrabold tabular-nums">{formatKwacha(data.turnover.period)}</dd>
                </div>
                <div className="bg-white p-4 sm:p-5">
                  <dt className="text-[13px] font-semibold text-ink-muted">Projected annual turnover</dt>
                  <dd className="mt-1.5 text-xl font-extrabold tabular-nums">{formatKwacha(data.turnover.annualised)}</dd>
                </div>
                <div className="bg-white p-4 sm:p-5">
                  <dt className="text-[13px] font-semibold text-ink-muted">Annualised turnover-tax scenarios</dt>
                  <dd className="mt-1.5 text-sm font-bold tabular-nums">
                    {data.turnoverEstimate.excessOnly == null
                      ? 'Review required'
                      : `${formatKwacha(data.turnoverEstimate.excessOnly)} / ${formatKwacha(data.turnoverEstimate.totalTurnover)}`}
                  </dd>
                </div>
              </dl>
              <p className="px-4 py-3 text-[13px] text-ink-muted sm:px-5">Values are excess-only / full-turnover scenarios, not a range or tax decision. They are projected from the last 90 days and need Finance review.</p>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="VAT threshold progress" description="Reference indicator only; taxable-supply rules apply" />
              <div className="p-4 sm:p-5"><TaxProgress vat={data.vat} /></div>
            </Card>
          </div>

          <section className="mt-8" aria-labelledby="regimes-heading">
            <h2 id="regimes-heading" className="text-[15px] font-bold">Tax scenarios and limits</h2>
            <p className="mb-3 mt-0.5 text-[13px] text-ink-muted">The turnover-tax card shows two alternative bases. Income-tax and VAT liabilities are left uncalculated where required details are missing.</p>
            <RegimeComparison regimes={data.regimes} lowestId={data.lowestRegimeId} />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="notifications-heading">
              <h2 id="notifications-heading" className="mb-3 text-[15px] font-bold">Tax notifications</h2>
              <div className="space-y-3">
                {data.notifications.map((n) => (
                  <Notification key={n.id} tone={n.tone} title={n.title}>{n.body}</Notification>
                ))}
              </div>
            </section>
            <section aria-labelledby="changes-heading">
              <h2 id="changes-heading" className="mb-3 text-[15px] font-bold">What tax changes would mean</h2>
              <Card className="divide-y divide-line">
                {data.changes.map((c) => (
                  <details key={c.id} className="group px-4 py-3.5 sm:px-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded text-sm font-semibold focus-ring">
                      {c.title}
                      <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.body}</p>
                  </details>
                ))}
              </Card>
            </section>
          </div>

          <p className="mt-8 flex items-center gap-2 text-[13px] text-ink-muted">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Want the figures behind this? <Link to="/app/transactions" className="font-semibold text-brand-700 underline">Review your transactions</Link>.
          </p>
        </div>
      )}
    </div>
  );
}

