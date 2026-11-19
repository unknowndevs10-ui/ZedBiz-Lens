import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { BarChart3, Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import PeriodFilter from '../components/common/PeriodFilter';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import Notification from '../components/common/Notification';
import StatCard from '../components/dashboard/StatCard';
import PerformanceSummary from '../components/dashboard/PerformanceSummary';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import RevenueExpenseChart from '../components/charts/RevenueExpenseChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import { useData } from '../context/DataContext';
import { useAsync } from '../hooks/useAsync';
import { insightsService } from '../services/insightsService';
import { formatDate, formatKwacha, formatPercent } from '../utils/format';

export default function DashboardPage() {
  const { openAddEntry } = useOutletContext();
  const { businessId, business, version, pendingCount } = useData();
  const [period, setPeriod] = useState('30d');
  const { data, loading, error, reload } = useAsync(() => insightsService.getDashboard({ businessId, period }), [businessId, period, version]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{business?.name || 'Dashboard'}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {business ? `${business.kind} · ` : ''}
            {data ? `${formatDate(data.period.start)} to ${formatDate(data.period.end)}` : 'Business overview'}
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </header>

      {pendingCount > 0 && (
        <Notification tone="warning" className="mt-5" title={`${pendingCount} ${pendingCount === 1 ? 'entry is' : 'entries are'} waiting for review`}>
          Pending entries are not counted yet. <Link to="/app/transactions" className="font-bold text-brand-700 underline">Review them now</Link>.
        </Notification>
      )}

      {!data && loading ? (
        <LoadingState label="Loading dashboard" />
      ) : error ? (
        <Card className="mt-6"><ErrorState title="We could not load the dashboard" description={error.message} onRetry={reload} /></Card>
      ) : data.transactionCount === 0 ? (
        <Card className="mt-6">
          <EmptyState icon={BarChart3} title="No confirmed transactions in this period" description="Add an entry and confirm it, or choose a longer time period." action={<Button icon={Plus} onClick={openAddEntry}>Add an entry</Button>} />
        </Card>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <Card className="mt-6 overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-5">
              <StatCard label="Total sales" value={formatKwacha(data.summary.sales)} delta={data.deltas?.sales} />
              <StatCard label="Total expenses" value={formatKwacha(data.summary.expenses)} delta={data.deltas?.expenses} goodWhenUp={false} />
              <StatCard label="Gross profit" value={formatKwacha(data.summary.grossProfit)} delta={data.deltas?.grossProfit} />
              <StatCard label="Net profit" value={formatKwacha(data.summary.netProfit)} delta={data.deltas?.netProfit} emphasis />
              <StatCard label="Profit margin" value={formatPercent(data.summary.margin)} delta={data.deltas?.margin} deltaUnit="pp" className="col-span-2 lg:col-span-1" />
            </div>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue and expenses" description={`Grouped ${data.series.length > 31 || data.period.days > 31 ? 'by week' : 'by day'}. Tap or hover for exact figures.`} />
              <div className="p-4 sm:p-5"><RevenueExpenseChart series={data.series} /></div>
            </Card>
            <Card>
              <CardHeader title="Where the money goes" description="Expenses by category" />
              <div className="p-4 sm:p-5"><CategoryBreakdown items={data.expenseBreakdown} /></div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <PerformanceSummary data={data} />
            <RecentTransactions transactions={data.recent} />
          </div>
        </div>
      )}
    </div>
  );
}
