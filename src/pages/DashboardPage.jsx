import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, CircleAlert, Clock3, Plus, Sparkles, WalletCards } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import PeriodFilter from '../components/common/PeriodFilter';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import RevenueExpenseChart from '../components/charts/RevenueExpenseChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
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

function Metric({ label, value, note, icon: Icon, emphasis = false }) {
  return <article className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${emphasis ? 'border-brand-200 bg-brand-50' : 'border-line bg-white'}`}>
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-ink-muted">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${emphasis ? 'bg-white text-brand-700' : 'bg-surface text-brand-700'}`}><Icon className="h-4 w-4" /></span></div>
    <p className="mt-3 truncate text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">{value}</p>
    <p className="mt-1 text-[10px] leading-4 text-ink-muted">{note}</p>
  </article>;
}

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
  const { data: forecast } = useAsync(() => predictBusinessOutlook(confirmedSalesHistory, businessProfile || {}), [confirmedSalesHistory, businessProfile]);
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
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setVoiceError('');
    setSpeaking(true);
    try { await speakBusinessText(signals.map((signal) => `${signal.title}. ${signal.body}`).join(' '), businessProfile?.language || 'English'); }
    catch (cause) { setVoiceError(cause.message || 'Voice playback could not start.'); }
    finally { setSpeaking(false); }
  }

  async function openSampleWorkspace() {
    setLoadingSample(true);
    try { await enterSyntheticDemo(); toast('A synthetic, read-only sample workspace is ready.'); }
    catch (cause) { toast(cause.message || 'The sample workspace could not be opened.', { tone: 'danger', title: 'Sample unavailable' }); }
    finally { setLoadingSample(false); }
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-bold text-ink-muted"><span className="h-1.5 w-1.5 rounded-full bg-success" /> BUSINESS WORKSPACE <span className="text-line">/</span> TODAY</div>
          <h1 className="text-2xl font-extrabold tracking-[-.04em] sm:text-3xl">{businessProfile?.displayName ? `Good to see you, ${businessProfile.displayName}` : 'Let’s get the day in focus.'}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{business?.name || businessProfile?.businessName || 'Your business'} · confirmed records shape every total.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Sparkles} onClick={() => setWelcomeReplay((value) => value + 1)}>Welcome guide</Button>
          {!isSyntheticDemo && <Button variant="secondary" loading={loadingSample} onClick={openSampleWorkspace}>Sample workspace</Button>}
          {!isSyntheticDemo && <Button icon={Plus} onClick={openAddEntry}>Add record</Button>}
        </div>
      </header>

      <WelcomeExperience ready={status === 'ready'} profile={businessProfile} openSignal={welcomeReplay} />

      {(ledgerError || (status === 'error' && !ledgerError)) && <Card className="p-4"><ErrorState title="Your records could not load" description={ledgerError?.message || 'Check your connection and retry.'} onRetry={reload} /></Card>}

      {unresolvedChecks.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-800" /><p className="text-xs leading-5"><strong>Profile details to review</strong><span className="block text-ink-muted">{unresolvedChecks.map(([, label]) => label).join(', ')} · self-reported, not an eligibility decision.</span></p></div><Button variant="secondary" size="sm" to="/app/profile">Review details</Button></div>}

      <section aria-label="Business totals">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">CONFIRMED ACTIVITY</p><h2 className="mt-1 text-base font-extrabold">Your numbers, at a glance</h2></div><PeriodFilter value={period} onChange={setPeriod} /></div>
        {loading && !data ? <Card className="p-4"><LoadingState label="Preparing your business view" /></Card> : error ? <Card className="p-4"><ErrorState title="We could not prepare this view" description={error.message} onRetry={reloadDashboard} /></Card> : data && <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Sales" value={formatKwacha(data.summary.sales)} note={`${data.transactionCount} confirmed records in this period`} icon={ArrowRight} />
          <Metric label="Gross profit" value={formatKwacha(data.summary.grossProfit)} note="Sales less recorded stock purchases" icon={ChartNoAxesCombined} />
          <Metric label="Net profit" value={formatKwacha(data.summary.netProfit)} note="Management view, not taxable profit" icon={WalletCards} emphasis />
        </div>}
        {data && <p className="mt-2 px-1 text-[10px] leading-5 text-ink-muted">{data.summary.sales > 0 ? `Recorded margin ${formatPercent(data.summary.margin)}. ` : ''}Only confirmed records are included. Expenses and owner drawings are treated according to their recorded category.</p>}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]" aria-label="Next steps and business intelligence">
        <div>
          {data && data.transactionCount > 0 ? <BusinessPulse signals={signals} onSpeak={speakSignals} speaking={speaking} /> : <Card className="overflow-hidden border-brand-200 bg-brand-50"><div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div><p className="eyebrow">YOUR BUSINESS, LEARNING IN CONTEXT</p><h2 className="mt-2 text-xl font-extrabold tracking-tight">Start with one thing that happened today.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Describe a sale, stock purchase or customer tab. ZedBiz prepares separate drafts, explains what it found and waits for your approval.</p></div><Button size="lg" icon={ArrowRight} to="/app/capture">Record today</Button></div><div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-200 px-5 py-3 text-[10px] font-semibold text-ink-muted sm:px-7"><span>Voice or text</span><span>·</span><span>Review before totals change</span><span>·</span><span>Offline capture</span></div></Card>}
          {voiceError && <p role="status" className="mt-2 text-xs text-ink-muted">{voiceError}</p>}
        </div>
        <Card className="flex flex-col justify-between p-5"><div><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">QUICK CAPTURE</p><h2 className="mt-1 text-base font-extrabold">Keep today in order</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Clock3 className="h-5 w-5" /></span></div><p className="mt-2 text-xs leading-5 text-ink-muted">Add a sale, expense, cash count or customer credit. Drafts stay separate until you confirm.</p></div><div className="mt-5 grid grid-cols-2 gap-2"><Button variant="secondary" to="/app/capture" className="w-full">Open capture</Button><Button variant="secondary" onClick={openAddEntry} className="w-full">Quick note</Button></div></Card>
      </section>

      {isMarketBusiness && <details className="group rounded-2xl border border-line bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="eyebrow">MARKET OPERATIONS</p><h2 className="mt-1 text-sm font-extrabold">Stock, customer credit & cash count</h2></div><span className="text-xs font-bold text-brand-700 group-open:hidden">Open</span><span className="hidden text-xs font-bold text-brand-700 group-open:inline">Close</span></summary><div className="border-t border-line p-4 sm:p-5"><MarketOperations businessId={businessId} userId={user?.id} transactions={transactions} submitAgentDraft={submitAgentDraft} readOnly={isSyntheticDemo} onCashClose={(close) => { operationsStore.saveCashClose(user?.id, businessId, close); setCashClose(close); }} /></div></details>}
      {!isMarketBusiness && isRetailBusiness && <details className="group rounded-2xl border border-line bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="eyebrow">RETAIL OPERATIONS</p><h2 className="mt-1 text-sm font-extrabold">Stock & reorder notes</h2></div><span className="text-xs font-bold text-brand-700 group-open:hidden">Open</span><span className="hidden text-xs font-bold text-brand-700 group-open:inline">Close</span></summary><div className="border-t border-line p-4 sm:p-5"><InventoryPanel items={inventory} readOnly={isSyntheticDemo} onChange={(items) => { setInventory(items); if (!isSyntheticDemo) operationsStore.saveInventory(user?.id, businessId, items); }} /></div></details>}

      {data && data.transactionCount > 0 && <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]" aria-label="Recent business activity"><RecentTransactions transactions={data.recent} /><Card className="p-4 sm:p-5"><CardHeader title="Period in view" description={`${data.period.label} · confirmed activity only`} /><dl className="mt-3 divide-y divide-line px-1">{[['Average daily sales', formatKwacha(data.insights.averageDailySales)], ['Best sales day', data.insights.bestDay ? formatKwacha(data.insights.bestDay.amount) : 'No sales yet'], ['Largest expense', data.insights.topExpense?.category || 'No expenses yet']].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3"><dt className="text-xs text-ink-muted">{label}</dt><dd className="text-xs font-extrabold tabular-nums">{value}</dd></div>)}</dl></Card></section>}

      {forecast && <details className="group rounded-2xl border border-line bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="eyebrow">EXPERIMENTAL OUTLOOK</p><h2 className="mt-1 text-sm font-extrabold">Revenue scenario</h2></div><span className="text-xs font-bold text-brand-700 group-open:hidden">Open</span><span className="hidden text-xs font-bold text-brand-700 group-open:inline">Close</span></summary><div className="grid gap-4 border-t border-line p-4 sm:grid-cols-[1fr_auto] sm:p-5"><div><p className="text-sm leading-6 text-ink-muted">{forecast.explanation}</p><p className="mt-3 text-xs text-ink-muted">Source: {forecast.source}. This is experimental context, not a guaranteed prediction.</p></div><div className="rounded-xl bg-surface p-4 sm:min-w-52"><p className="text-[10px] font-bold text-ink-muted">ILLUSTRATIVE REVENUE</p><p className="mt-1 text-xl font-extrabold tabular-nums">{formatKwacha(forecast.predicted_revenue)}</p><p className="mt-1 text-[10px] tabular-nums text-ink-muted">Range {formatKwacha(forecast.confidence_low)} — {formatKwacha(forecast.confidence_high)}</p></div></div></details>}

      {data && data.transactionCount > 0 && <details className="group rounded-2xl border border-line bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5"><div><p className="eyebrow">MORE DETAIL</p><h2 className="mt-1 text-sm font-extrabold">Sales, expenses & cost mix</h2></div><span className="text-xs font-bold text-brand-700 group-open:hidden">Open analysis</span><span className="hidden text-xs font-bold text-brand-700 group-open:inline">Close analysis</span></summary><div className="grid gap-5 border-t border-line p-4 lg:grid-cols-[1.3fr_.7fr] sm:p-5"><div><CardHeader title="Activity over time" description={`${data.period.label} · recorded totals`} /><div className="mt-3"><RevenueExpenseChart series={data.series} /></div></div><div className="rounded-xl border border-line p-3"><h3 className="text-sm font-extrabold">Expense mix</h3><CategoryBreakdown items={data.expenseBreakdown} /></div></div></details>}

      {data && data.transactionCount === 0 && <Card className="p-4"><EmptyState icon={Plus} title="Your ledger is ready for its first entry" description="Record a real sale or expense to start. To explore populated sample records, open the separate synthetic workspace." action={<Button icon={ArrowRight} to="/app/capture">Record your first entry</Button>} /></Card>}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[10px] text-ink-muted"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand-700" />Only approved records update your totals.</span><span>{isSyntheticDemo ? 'Synthetic sample · read only' : `Signed in as ${user?.email || 'business owner'}`}</span></div>
    </div>
  );
}
