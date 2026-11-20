import { useMemo, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CircleAlert, ClipboardList, Plus, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import PeriodFilter from '../components/common/PeriodFilter';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import RevenueExpenseChart from '../components/charts/RevenueExpenseChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import StatCard from '../components/dashboard/StatCard';
import PerformanceSummary from '../components/dashboard/PerformanceSummary';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import BusinessPulse from '../components/dashboard/BusinessPulse';
import WelcomeExperience from '../components/dashboard/WelcomeExperience';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { insightsService } from '../services/insightsService';
import { buildBusinessSignals } from '../services/businessBrain';
import { speakBusinessText, stopSpeaking } from '../services/voiceService';
import { formatKwacha, formatPercent } from '../utils/format';

const TAX_STATUS = [
  ['pacraStatus', 'PACRA registration'],
  ['zraStatus', 'ZRA TPIN'],
  ['vatStatus', 'VAT registration'],
];

export default function DashboardPage() {
  const { openAddEntry } = useOutletContext();
  const { businessId, business, businessProfile, transactions, status, error: ledgerError, reload, version } = useData();
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [speaking, setSpeaking] = useState(false);
  const [welcomeReplay, setWelcomeReplay] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const { data, loading, error, reload: reloadDashboard } = useAsync(
    () => insightsService.getDashboard({ businessId, period }),
    [businessId, period, version],
  );
  const signals = useMemo(() => buildBusinessSignals({ profile: businessProfile, transactions }), [businessProfile, transactions]);
  const unresolvedChecks = businessProfile?.businessFormality === 'informal'
    ? []
    : TAX_STATUS.filter(([key]) => !['yes', 'no'].includes(businessProfile?.[key]));

  async function speakSignals() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setVoiceError('');
    setSpeaking(true);
    try {
      const shortBrief = signals.map((signal) => `${signal.title}. ${signal.body}`).join(' ');
      await speakBusinessText(shortBrief, businessProfile?.language || 'English');
    } catch (cause) {
      setVoiceError(cause.message || 'Voice playback could not start.');
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">YOUR BUSINESS, IN FOCUS</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{businessProfile?.displayName ? `Good to see you, ${businessProfile.displayName}` : 'Your business at a glance'}</h1>
          <p className="mt-1 text-sm text-ink-muted">{business?.name || businessProfile?.businessName || 'Your business'} <span aria-hidden="true">�</span> a clearer view of the numbers you have confirmed.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Sparkles} onClick={() => setWelcomeReplay((value) => value + 1)}>Welcome guide</Button>
          <Button icon={Plus} onClick={openAddEntry}>Add entry</Button>
        </div>
      </header>

      <WelcomeExperience ready={status === 'ready'} profile={businessProfile} openSignal={welcomeReplay} />
      <BusinessPulse signals={signals} onSpeak={speakSignals} speaking={speaking} />
      {voiceError && <p role="status" className="mt-2 text-xs text-ink-muted">{voiceError}</p>}

      {(ledgerError || (status === 'error' && !ledgerError)) && <Card className="mt-5"><ErrorState title="Your ledger could not be loaded" description={ledgerError?.message || 'Check your connection and retry.'} onRetry={reload} /></Card>}

      {unresolvedChecks.length > 0 && (
        <Card className="mt-5 border-accent-100 bg-[#171a17]">
          <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-800"><CircleAlert className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold">A few business details are still open</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">Your dashboard is ready. When convenient, review {unresolvedChecks.map(([, label]) => label).join(', ')} in your profile. These answers are self-reported and do not determine eligibility.</p></div></div>
            <Button variant="secondary" size="sm" icon={ArrowRight} to="/app/profile">Review profile</Button>
          </div>
        </Card>
      )}

      <section className="mt-6" aria-label="Business totals">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-extrabold">Confirmed activity</h2><PeriodFilter value={period} onChange={setPeriod} /></div>
        {loading && !data ? <Card><LoadingState label="Preparing your business view" /></Card> : error ? <Card><ErrorState title="We could not prepare the dashboard" description={error.message} onRetry={reloadDashboard} /></Card> : data && (
          <>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sales" value={formatKwacha(data.summary.sales)} delta={data.deltas?.sales} />
              <StatCard label="Expenses" value={formatKwacha(data.summary.expenses)} delta={data.deltas?.expenses} goodWhenUp={false} />
              <StatCard label="Gross profit" value={formatKwacha(data.summary.grossProfit)} delta={data.deltas?.grossProfit} />
              <StatCard label="Net profit" value={formatKwacha(data.summary.netProfit)} delta={data.deltas?.netProfit} emphasis />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Gross profit is sales less entries categorized as stock purchases. Net profit is sales less all recorded expenses; it is a management view, not taxable profit. {data.summary.sales > 0 ? `Recorded margin: ${formatPercent(data.summary.margin)}.` : 'Add and confirm records to build a meaningful comparison.'}</p>
          </>
        )}
      </section>

      {data && !loading && data.transactionCount === 0 ? (
        <Card className="mt-6"><EmptyState icon={ClipboardList} title="Your ledger is ready for its first real entry" description="Add a sale or expense from your business. It will appear as a draft for your review and only count after you confirm it." action={<Button icon={Plus} onClick={openAddEntry}>Add your first entry</Button>} /></Card>
      ) : data && (
        <>
          <section className="mt-6 grid gap-6 xl:grid-cols-5" aria-label="Performance and costs">
            <Card className="xl:col-span-3"><CardHeader title="Sales, expenses and profit" description={`${data.period.label} � compare the numbers recorded for this period`} /><div className="p-4 pt-3 sm:p-5 sm:pt-3"><RevenueExpenseChart series={data.series} /></div></Card>
            <div className="space-y-6 xl:col-span-2"><PerformanceSummary data={data} /><Card><CardHeader title="Expense mix" description="Where confirmed costs were recorded" /><div className="p-4 pt-4 sm:p-5"><CategoryBreakdown items={data.expenseBreakdown} /></div></Card></div>
          </section>
          <section className="mt-6 grid gap-6 xl:grid-cols-5" aria-label="Recent activity and insights">
            <div className="xl:col-span-3"><RecentTransactions transactions={data.recent} /></div>
            <Card className="xl:col-span-2"><CardHeader title="A useful next step" description="Built from the records currently in this period" /><div className="p-4 pt-3 sm:p-5 sm:pt-3"><p className="text-sm leading-6 text-ink-muted">{data.transactionCount < 5 ? 'Keep recording the days you trade. A small number of entries can make a trend look stronger or weaker than it is.' : `You have ${data.transactionCount} confirmed entries in this view. Compare busy days with the costs you recorded to understand what is driving your results.`}</p><Link to="/app/transactions" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-brand-700 hover:underline">Review your ledger <ArrowRight className="h-3.5 w-3.5" /></Link></div></Card>
          </section>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-[#111819] px-4 py-3 text-xs text-ink-muted"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand-700" />Only records you confirm flow into your totals.</span><span>Account: {user?.email || 'UnknownDevs workspace'}</span></div>
    </div>
  );
}

