import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import InventoryPanel from '../components/dashboard/InventoryPanel';
import MarketOperations from '../components/dashboard/MarketOperations';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { insightsService } from '../services/insightsService';
import { buildSystemInCheck, predictBusinessOutlook } from '../services/aiEngine';
import { operationsStore } from '../services/operationsStore';
import { speakBusinessText, stopSpeaking } from '../services/voiceService';
import { formatKwacha, formatPercent } from '../utils/format';

const TAX_STATUS = [
  ['pacraStatus', 'PACRA registration'],
  ['zraStatus', 'ZRA TPIN'],
  ['vatStatus', 'VAT registration'],
];

export default function DashboardPage() {
  const { openAddEntry } = useOutletContext();
  const { businessId, business, businessProfile, transactions, status, error: ledgerError, reload, version, isSyntheticDemo, enterSyntheticDemo, submitAgentDraft } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [speaking, setSpeaking] = useState(false);
  const [welcomeReplay, setWelcomeReplay] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);
  const [inventory, setInventory] = useState(() => operationsStore.listInventory(user?.id, businessId));
  const [cashClose, setCashClose] = useState(() => operationsStore.getCashClose(user?.id, businessId, new Date().toISOString().slice(0, 10)));
  const { data, loading, error, reload: reloadDashboard } = useAsync(
    () => insightsService.getDashboard({ businessId, period }),
    [businessId, period, version],
  );
  const confirmedSalesHistory = useMemo(() => {
    const byDate = new Map();
    transactions.filter((tx) => tx.status === 'confirmed' && tx.type === 'income').forEach((tx) => {
      byDate.set(tx.date, (byDate.get(tx.date) || 0) + Number(tx.amount || 0));
    });
    return [...byDate].map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  }, [transactions]);
  const { data: forecast } = useAsync(
    () => predictBusinessOutlook(confirmedSalesHistory, businessProfile || {}),
    [confirmedSalesHistory, businessProfile],
  );
  useEffect(() => {
    setInventory(operationsStore.listInventory(user?.id, businessId));
    setCashClose(operationsStore.getCashClose(user?.id, businessId, new Date().toISOString().slice(0, 10)));
  }, [user?.id, businessId]);
  const systemInCheck = useMemo(() => buildSystemInCheck({ profile: businessProfile, transactions, inventory, cashCount: cashClose, forecast }), [businessProfile, transactions, inventory, cashClose, forecast]);
  const signals = systemInCheck.cards;
  const businessKind = String(businessProfile?.businessType || '').toLowerCase();
  const isMarketBusiness = businessProfile?.businessFormality === 'informal' || /market|trader|hawker|produce|food/.test(businessKind);
  const isRetailBusiness = /retail|shop|kantemba|grocery|auto|spares/.test(businessKind);
  const unresolvedChecks = isSyntheticDemo || businessProfile?.businessFormality === 'informal'
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

  async function openSampleWorkspace() {
    setLoadingSample(true);
    try {
      await enterSyntheticDemo();
      toast('A synthetic, read-only sample workspace is ready.');
    } catch (cause) {
      toast(cause.message || 'The sample workspace could not be opened.', { tone: 'danger', title: 'Sample unavailable' });
    } finally {
      setLoadingSample(false);
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
          {!isSyntheticDemo && <Button variant="secondary" icon={Sparkles} loading={loadingSample} onClick={openSampleWorkspace}>Explore synthetic demo</Button>}
          {!isSyntheticDemo && <Button icon={Plus} onClick={openAddEntry}>Add entry</Button>}
        </div>
      </header>

      <WelcomeExperience ready={status === 'ready'} profile={businessProfile} openSignal={welcomeReplay} />

      {(ledgerError || (status === 'error' && !ledgerError)) && <Card className="mt-5"><ErrorState title="Your ledger could not be loaded" description={ledgerError?.message || 'Check your connection and retry.'} onRetry={reload} /></Card>}

      {unresolvedChecks.length > 0 && (
        <Card className="mt-5 border-accent-100 bg-accent-50">
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
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              <StatCard label="Sales" value={formatKwacha(data.summary.sales)} delta={data.deltas?.sales} />
              <StatCard label="Gross profit" value={formatKwacha(data.summary.grossProfit)} delta={data.deltas?.grossProfit} />
              <StatCard label="Net profit" value={formatKwacha(data.summary.netProfit)} delta={data.deltas?.netProfit} emphasis />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Gross profit is sales less entries categorized as stock purchases. Net profit is sales less all recorded expenses; it is a management view, not taxable profit. {data.summary.sales > 0 ? `Recorded margin: ${formatPercent(data.summary.margin)}.` : 'Add and confirm records to build a meaningful comparison.'}</p>
          </>
        )}
      </section>

      {data && data.transactionCount > 0 && <><BusinessPulse signals={signals} onSpeak={speakSignals} speaking={speaking} />{voiceError && <p role="status" className="mt-2 text-xs text-ink-muted">{voiceError}</p>}</>}

      {isMarketBusiness && <MarketOperations
        businessId={businessId}
        userId={user?.id}
        transactions={transactions}
        submitAgentDraft={submitAgentDraft}
        readOnly={isSyntheticDemo}
        onCashClose={(close) => {
          operationsStore.saveCashClose(user?.id, businessId, close);
          setCashClose(close);
        }}
      />}
      {!isMarketBusiness && isRetailBusiness && <InventoryPanel
        items={inventory}
        readOnly={isSyntheticDemo}
        onChange={(items) => {
          setInventory(items);
          if (!isSyntheticDemo) operationsStore.saveInventory(user?.id, businessId, items);
        }}
      />}

      {forecast && <section className="mt-5 border-y border-line py-4" aria-labelledby="forecast-title"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">30-DAY OUTLOOK</p><h2 id="forecast-title" className="mt-1 text-base font-extrabold">Revenue scenario</h2><p className="mt-1 text-xs text-ink-muted">{forecast.explanation}</p></div><div className="text-right"><p className="text-xs font-semibold text-ink-muted">Illustrative revenue</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{formatKwacha(forecast.predicted_revenue)}</p><p className="mt-1 text-[11px] tabular-nums text-ink-muted">Range {formatKwacha(forecast.confidence_low)} - {formatKwacha(forecast.confidence_high)}</p></div></div><p className="mt-3 border-l border-brand-700 pl-3 text-xs text-ink-muted">Driver: {forecast.growth_driver} � Source: {forecast.source}</p></section>}

      {data && !loading && data.transactionCount === 0 ? (
        <Card className="mt-6"><EmptyState icon={ClipboardList} title="Your ledger is ready for its first entry" description="Add a real sale or expense to begin. To explore the app with populated sample records, choose Explore synthetic demo above; those records stay separate from your ledger." action={<Button icon={Plus} onClick={openAddEntry}>Add your first entry</Button>} /></Card>
      ) : data && (
        <>
          <section className="mt-6 grid gap-6 xl:grid-cols-5" aria-label="Performance and costs">
            <Card className="xl:col-span-3"><CardHeader title="Sales, expenses and profit" description={`${data.period.label} � recorded activity over time`} /><div className="p-4 pt-3 sm:p-5 sm:pt-3"><RevenueExpenseChart series={data.series} /></div></Card>
            <div className="space-y-4 xl:col-span-2"><PerformanceSummary data={data} /><details className="rounded-lg border border-line bg-[#121a1b]"><summary className="cursor-pointer px-4 py-4 text-sm font-bold hover:text-brand-700">Expense mix</summary><div className="border-t border-line p-4 sm:p-5"><CategoryBreakdown items={data.expenseBreakdown} /></div></details></div>
          </section>
          <section className="mt-6" aria-label="Recent activity"><RecentTransactions transactions={data.recent} /></section>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-[#111819] px-4 py-3 text-xs text-ink-muted"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand-700" />Only records you confirm flow into your totals.</span><span>Account: {user?.email || 'UnknownDevs workspace'}</span></div>
    </div>
  );
}

