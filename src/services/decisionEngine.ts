import { buildBusinessSignals } from './businessBrain';
import { formatKwacha, todayISO, addDays } from '../utils/format';

const money = (value: number) => formatKwacha(value);
const lower = (value: unknown) => String(value || '').toLowerCase();

function actionCard({ id, priority = 'medium', headline, reason, action, metric, tone = 'teal', href = '/app/transactions' }: any) {
  return {
    id, priority, headline, plain_english_reason: reason, recommended_action: action,
    deterministic_metric: metric || null,
    // Presentation aliases keep the card renderer simple.
    tone, title: headline, body: reason, action, evidence: metric?.value || 'Based on owner-confirmed records', href,
    source: 'deterministic-business-rules',
  };
}

/** Explainable, profile-aware operational decisions. No model output controls money or tax. */
export function buildDecisionCards({ profile, transactions = [], inventory = [], cashCount = null }: any) {
  const confirmed = transactions.filter((tx: any) => tx.status === 'confirmed');
  const pending = transactions.filter((tx: any) => tx.status === 'pending');
  const cards: any[] = [];
  const kind = lower(profile?.businessType);
  const isMarket = /market|trader|hawker|agric|produce|food/.test(kind) || profile?.businessFormality === 'informal';
  const isService = /service|salon|trade|electrical|repair|professional|construction/.test(kind);
  const isRetail = /retail|shop|kantemba|grocery|auto|spares/.test(kind);

  if (pending.length) cards.push(actionCard({
    id: 'owner-review-queue', priority: 'high', tone: 'blue',
    headline: `${pending.length} draft${pending.length === 1 ? '' : 's'} need your review`,
    reason: 'AI-prepared entries remain outside confirmed sales, expenses and tax estimates until you check and confirm them.',
    action: 'Review drafts', href: '/app/transactions',
    metric: { label: 'Pending owner decisions', value: String(pending.length) },
  }));

  const fees = confirmed.filter((tx: any) => tx.type === 'expense' && /mobile money fees/i.test(String(tx.category || '')))
    .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  if (fees > 0) cards.push(actionCard({
    id: 'momo-fees', priority: 'medium', tone: 'amber',
    headline: 'Mobile-money fees are visible in your costs',
    reason: 'Confirmed transaction-fee records are grouped separately so you can review how much payment collection costs the business.',
    action: 'Review mobile-money fees', href: '/app/transactions',
    metric: { label: 'Recorded fees', value: money(fees) },
  }));

  const overdueCredit = confirmed.filter((tx: any) => tx.type === 'income' && tx.paymentMethod === 'credit' && tx.date < addDays(todayISO(), -7));
  if (overdueCredit.length) {
    const amount = overdueCredit.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    cards.push(actionCard({
      id: 'aging-customer-credit', priority: 'high', tone: 'amber',
      headline: `${overdueCredit.length} customer credit sale${overdueCredit.length === 1 ? '' : 's'} are over 7 days old`,
      reason: 'These confirmed entries were marked as credit and have no settlement tracking in this demo. Check your own records before contacting a customer; no payment reminder is sent automatically.',
      action: 'Review credit entries', href: '/app/transactions',
      metric: { label: 'Recorded credit sales to check', value: money(amount) },
    }));
  }

  const ninetyDaysAgo = addDays(todayISO(), -89);
  const standardRatedSales = confirmed.filter((tx: any) => tx.type === 'income' && tx.vatTreatment === 'standard_rated' && tx.date >= ninetyDaysAgo && tx.date <= todayISO())
    .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  const annualizedStandardSales = standardRatedSales * (365 / 90);
  const vatThreshold = 800000;
  if (annualizedStandardSales >= vatThreshold * 0.8) cards.push(actionCard({
    id: 'vat-threshold-early-warning', priority: 'high', tone: 'amber',
    headline: 'Standard-rated sales are nearing the VAT reference threshold',
    reason: 'A simple run-rate from the last 90 days is above 80% of K800,000. This is an early review prompt, not a registration determination or filing calculation.',
    action: 'Review VAT readiness', href: '/app/tax',
    metric: { label: 'Annualized standard-rated run-rate', value: `${money(annualizedStandardSales)} / ${money(vatThreshold)}` },
  }));

  if (isMarket) {
    const since = addDays(todayISO(), -29);
    const recent = confirmed.filter((tx: any) => tx.date >= since && tx.date <= todayISO());
    const stock = recent.filter((tx: any) => tx.type === 'expense' && tx.category === 'Stock purchases').reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const waste = recent.filter((tx: any) => tx.type === 'expense' && tx.category === 'Spoilage & wastage').reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const denominator = stock + waste;
    cards.push(actionCard({
      id: 'wastage-pattern', priority: waste > 0 ? 'high' : 'low', tone: waste > 0 ? 'amber' : 'teal',
      headline: waste > 0 ? 'Recent spoilage is recorded' : 'Track spoilage to understand produce margins',
      reason: waste > 0 ? 'Wastage appears in the confirmed records. This is a cost signal to review alongside stock bought and sales.' : 'No spoilage entries were found in the last 30 days. A quick log helps keep gross profit from overstating what was actually sellable.',
      action: waste > 0 ? 'Review wastage entries' : 'Log spoilage', href: '/app/dashboard',
      metric: denominator > 0 ? { label: 'Wastage share of recorded stock costs', value: `${Math.round(waste / denominator * 100)}% (${money(waste)})` } : null,
    }));

    const salesByItem = new Map<string, { name: string; units: number }>();
    confirmed.filter((tx: any) => tx.type === 'income' && tx.itemName && Number(tx.quantity) > 0 && tx.date >= since && tx.date <= todayISO()).forEach((tx: any) => {
      const key = lower(tx.itemName).trim();
      const record = salesByItem.get(key) || { name: tx.itemName, units: 0 };
      record.units += Number(tx.quantity);
      salesByItem.set(key, record);
    });
    const demand = [...salesByItem.values()].sort((a, b) => b.units - a.units)[0];
    if (demand) {
      const observedDays = Math.max(1, Math.min(30, Math.floor((Date.now() - Date.parse(`${since}T00:00:00Z`)) / 86400000) + 1));
      const threeDayUnits = Math.ceil((demand.units / observedDays) * 3);
      cards.push(actionCard({
        id: 'three-day-demand-baseline', priority: 'medium', tone: 'blue',
        headline: `Recent recorded demand for ${demand.name}`,
        reason: 'This conservative 3-day quantity is a simple baseline from confirmed sales quantities over the last 30 days. It does not account for weather, market days, stock on hand or spoilage; review before buying.',
        action: 'Check stock before restocking', href: '/app/dashboard',
        metric: { label: 'Three-day sales baseline', value: `about ${threeDayUnits} units from ${demand.units} recorded in 30 days` },
      }));
    }

    const todayCash = confirmed.filter((tx: any) => tx.date === todayISO() && tx.paymentMethod === 'cash');
    const cashIn = todayCash.filter((tx: any) => tx.type === 'income').reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const cashOut = todayCash.filter((tx: any) => tx.type !== 'income').reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const tagged = todayCash.length;
    const metric = cashCount?.date === todayISO() && tagged ? {
      label: 'Expected vs counted closing cash',
      value: `${money(Number(cashCount.opening || 0) + cashIn - cashOut)} expected � ${money(Number(cashCount.actual || 0))} counted � ${money(Number(cashCount.actual || 0) - (Number(cashCount.opening || 0) + cashIn - cashOut))} variance`,
    } : tagged ? { label: 'Recorded cash movement today', value: `${money(cashIn)} in � ${money(cashOut)} out` } : null;
    cards.push(actionCard({
      id: 'cash-reconciliation', priority: 'medium', tone: 'blue',
      headline: cashCount?.date === todayISO() ? 'Cash close has been recorded' : 'Reconcile the cash in your till or bag',
      reason: tagged ? 'Expected movement uses only records marked cash. Transactions without a payment channel are excluded from this check.' : 'No confirmed cash-tagged records were found for today, so an expected till balance cannot be calculated yet.',
      action: 'Open cash close', href: '/app/dashboard', metric,
    }));
  }

  if (isRetail) {
    const recentPurchases = confirmed.filter((tx: any) => tx.type === 'expense' && tx.category === 'Stock purchases' && tx.itemName && tx.unitCost > 0);
    const groups = new Map<string, any[]>();
    recentPurchases.forEach((tx: any) => {
      const key = `${lower(tx.counterparty)}|${lower(tx.itemName)}`;
      groups.set(key, [...(groups.get(key) || []), tx]);
    });
    const priceChange = [...groups.values()].map((items) => items.sort((a, b) => a.date.localeCompare(b.date))).find((items) => items.length >= 2 && Number(items.at(-1).unitCost) > Number(items.at(-2).unitCost) * 1.05);
    cards.push(priceChange ? actionCard({
      id: 'supplier-price-change', priority: 'high', tone: 'amber',
      headline: `A recorded unit price rose for ${priceChange.at(-1).itemName}`,
      reason: `Two confirmed purchase records for this item and supplier show different unit costs. Check the receipt and quantities before drawing a conclusion.`,
      action: 'Compare purchase records', metric: { label: 'Recorded unit cost', value: `${money(Number(priceChange.at(-2).unitCost))}  ${money(Number(priceChange.at(-1).unitCost))}` },
    }) : actionCard({
      id: 'supplier-price-data', priority: 'low',
      headline: 'Track item and unit cost on stock receipts',
      reason: 'Supplier price movement can be compared only when receipt drafts include the same item, supplier and unit of measure.',
      action: 'Capture a stock receipt', metric: recentPurchases.length ? { label: 'Comparable item records', value: `${recentPurchases.length} recorded` } : null,
    }));
    const lowItems = inventory.filter((item: any) => Number(item.quantity) <= Number(item.reorderAt));
    if (lowItems.length) cards.push(actionCard({
      id: 'low-stock', priority: 'high', tone: 'amber',
      headline: `${lowItems.length} item${lowItems.length === 1 ? '' : 's'} at or below the restock level`,
      reason: `The count you entered for ${lowItems.slice(0, 3).map((item: any) => item.name).join(', ')} is at or below its restock level. Confirm the shelf count before ordering.`,
      action: 'Review stock counts', href: '/app/dashboard', metric: { label: 'Items to check', value: lowItems.map((item: any) => `${item.name} (${item.quantity})`).join(' � ') },
    }));
  }

  if (isService) {
    const jobs = new Map<string, { name: string; income: number; costs: number }>();
    confirmed.filter((tx: any) => tx.jobName).forEach((tx: any) => {
      const key = lower(tx.jobName).trim();
      const job = jobs.get(key) || { name: tx.jobName, income: 0, costs: 0 };
      if (tx.type === 'income') job.income += Number(tx.amount || 0);
      else if (tx.type === 'expense') job.costs += Number(tx.amount || 0);
      jobs.set(key, job);
    });
    const completedJob = [...jobs.values()].find((job) => job.income > 0 && job.costs > 0);
    cards.push(completedJob ? actionCard({
      id: 'job-profit', priority: 'medium',
      headline: `${completedJob.name} has a job-level view`,
      reason: 'Related confirmed income and expenses share the same job name. This management figure excludes owner withdrawals and does not determine taxable profit.',
      action: 'Review job entries', metric: { label: 'Recorded job contribution', value: money(completedJob.income - completedJob.costs) },
    }) : actionCard({
      id: 'job-tracking', priority: 'low',
      headline: 'Group job income and materials by client work',
      reason: 'No job with both confirmed income and expense records was found. Add the same job name to related entries to see a simple contribution view.',
      action: 'Tag a service job',
    }));
  }

  const general = buildBusinessSignals({ profile, transactions }).map((signal: any) => actionCard({
    id: signal.id, priority: signal.tone === 'amber' ? 'medium' : 'low', headline: signal.title,
    reason: signal.body, action: signal.action, tone: signal.tone, metric: signal.evidence ? { label: 'Evidence', value: signal.evidence } : null, href: signal.href,
  }));

  const unique = new Map<string, any>();
  [...cards, ...general].forEach((item) => { if (!unique.has(item.id)) unique.set(item.id, item); });
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return [...unique.values()]
    .sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))
    .slice(0, 3);
}

