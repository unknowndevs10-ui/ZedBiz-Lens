import { useMemo, useState } from 'react';
import { FileBarChart, Landmark } from 'lucide-react';
import PeriodFilter from '../components/common/PeriodFilter';
import ReportCard from '../components/reports/ReportCard';
import { useData } from '../context/DataContext';
import { useAsync } from '../hooks/useAsync';
import { insightsService } from '../services/insightsService';
import { downloadFinancialReport, downloadTaxReport } from '../services/reportService';
import { formatDate, formatKwacha, formatPercent } from '../utils/format';
import { calculateTaxReadiness } from '../services/taxEngine';

function PreviewRow({ label, value, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2 last:border-0">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className={`text-sm tabular-nums ${strong ? 'font-extrabold' : 'font-bold'}`}>{value}</dd>
    </div>
  );
}

export default function ReportsPage() {
  const { businessId, business, businessProfile, transactions, version } = useData();
  const [period, setPeriod] = useState('30d');
  const financial = useAsync(() => insightsService.getDashboard({ businessId, period }), [businessId, period, version]);
  const taxData = useMemo(() => calculateTaxReadiness(transactions, businessProfile || {}), [transactions, businessProfile, version]);

  const fin = financial.data;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">{business?.name} � Download PDF reports built from your confirmed entries.</p>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ReportCard
          icon={FileBarChart}
          title="Business financial report"
          description="Sales, expenses, profit and margin, with expenses broken down by category."
          periodLabel={fin ? `${formatDate(fin.period.start)} to ${formatDate(fin.period.end)}` : 'Loading'}
          periodControl={<PeriodFilter value={period} onChange={setPeriod} label="Report period" />}
          previewLoading={financial.loading && !fin}
          previewError={financial.error?.message}
          onDownload={() => downloadFinancialReport({ businessId, period })}
        >
          {fin && (
            <dl>
              <PreviewRow label="Total sales" value={formatKwacha(fin.summary.sales)} />
              <PreviewRow label="Total expenses" value={formatKwacha(fin.summary.expenses)} />
              <PreviewRow label="Gross profit" value={formatKwacha(fin.summary.grossProfit)} />
              <PreviewRow label="Net profit" value={formatKwacha(fin.summary.netProfit)} strong />
              <PreviewRow label="Profit margin" value={formatPercent(fin.summary.margin)} />
            </dl>
          )}
        </ReportCard>

        <ReportCard
          icon={Landmark}
          illustrative
          title="Tax position report"
          description="Turnover, threshold progress and regime comparison. Illustrative figures pending Finance team approval."
          periodLabel={taxData ? `Last ${taxData.basis.days} days (${formatDate(taxData.basis.start)} to ${formatDate(taxData.basis.end)})` : 'Loading'}
          previewLoading={false}
          onDownload={() => downloadTaxReport({ businessId })}
        >
          {taxData && (
            <dl>
              <PreviewRow label="Total sales (period)" value={formatKwacha(taxData.accounting.totalSales)} />
              <PreviewRow label="Projected annual turnover" value={formatKwacha(taxData.turnover.annualized)} />
              <PreviewRow label="VAT threshold progress indicator" value={formatPercent(taxData.vat.actualProgressPercent, 1)} strong />
              <PreviewRow label="Turnover-tax scenario � excess over floor" value={formatKwacha(taxData.turnover.excessOnly)} />
              <PreviewRow label="Turnover-tax scenario � full turnover" value={formatKwacha(taxData.turnover.fullTurnover)} />
              <PreviewRow label="Illustrative income-tax estimate" value={taxData.incomeTax.estimatedTax == null ? 'Complete tax profile to unlock' : formatKwacha(taxData.incomeTax.estimatedTax)} />
              <PreviewRow label="Illustrative VAT payable / exposure" value={taxData.vat.shouldEstimate ? formatKwacha(taxData.vat.vatPayableIllustration) : 'Threshold tracking only'} />
            </dl>
          )}
        </ReportCard>
      </div>
    </div>
  );
}

