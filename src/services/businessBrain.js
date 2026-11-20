import { addDays, todayISO } from '../utils/format';

const toDay = (value) => Date.parse(`${value}T00:00:00Z`);
const money = (value) => `K${Math.round(value).toLocaleString('en-ZM')}`;

/** Explainable pattern rules over owner-confirmed records and the business profile. */
export function buildBusinessSignals({ profile, transactions = [] }) {
  const confirmed = transactions.filter((item) => item.status === 'confirmed');
  const pending = transactions.filter((item) => item.status === 'pending');
  const start = addDays(todayISO(), -29);
  const previousStart = addDays(todayISO(), -59);
  const recent = confirmed.filter((item) => item.date >= start && item.date <= todayISO());
  const previous = confirmed.filter((item) => item.date >= previousStart && item.date < start);
  const salesOf = (list) => list.reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount) || 0 : 0), 0);
  const recentSales = salesOf(recent);
  const previousSales = salesOf(previous);
  const signals = [];

  if (!confirmed.length) {
    signals.push({ id: 'first-record', tone: 'teal', title: 'Start with one real day', body: `Your ${profile?.businessType || 'business'} workspace is ready. Add one sale or cost; I'll use the record you confirm to begin your business picture.`, evidence: 'No confirmed records yet', action: 'Add your first record', href: '/app/transactions' });
  } else if (recent.length < 5) {
    signals.push({ id: 'record-rhythm', tone: 'amber', title: 'Build a steadier record rhythm', body: `There ${recent.length === 1 ? 'is' : 'are'} ${recent.length} confirmed record${recent.length === 1 ? '' : 's'} in the last 30 days. If you traded on more days, add the missing days before relying on the trend.`, evidence: `${recent.length} records � last 30 days`, action: 'Review your ledger', href: '/app/transactions' });
  }

  if (pending.length) signals.push({ id: 'review-queue', tone: 'amber', title: 'Drafts need your review', body: `${pending.length} draft${pending.length === 1 ? '' : 's'} are waiting. Check the source note, amount, date and category before confirming; drafts are not counted in totals.`, evidence: `${pending.length} unconfirmed`, action: 'Review drafts', href: '/app/transactions' });

  if (previousSales > 0 && recentSales < previousSales * 0.85) {
    const change = Math.round((1 - recentSales / previousSales) * 100);
    signals.push({ id: 'sales-shift', tone: 'blue', title: 'Sales are lower than the previous period', body: `Confirmed sales are down about ${change}% compared with the previous 30 days. Check whether fewer trading days or missing records explain the change before drawing conclusions.`, evidence: `${money(recentSales)} vs ${money(previousSales)}`, action: 'Check the comparison', href: '/app/dashboard' });
  } else if (previousSales > 0 && recentSales > previousSales * 1.15) {
    const change = Math.round((recentSales / previousSales - 1) * 100);
    signals.push({ id: 'sales-growth', tone: 'teal', title: 'Sales are trending higher', body: `Confirmed sales are up about ${change}% against the previous 30 days. Keep checking costs and record coverage so growth reflects the whole picture.`, evidence: `${money(recentSales)} vs ${money(previousSales)}`, action: 'Review performance', href: '/app/dashboard' });
  }

  const categoryTotals = new Map();
  recent.filter((item) => item.type === 'expense').forEach((item) => categoryTotals.set(item.category || 'Other', (categoryTotals.get(item.category || 'Other') || 0) + Number(item.amount || 0)));
  const totalCosts = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const topCost = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCost && totalCosts > 0 && topCost[1] / totalCosts >= 0.3 && signals.length < 3) {
    const share = Math.round((topCost[1] / totalCosts) * 100);
    signals.push({ id: 'cost-pattern', tone: 'blue', title: `${topCost[0]} is a large share of recent costs`, body: `It accounts for about ${share}% of confirmed costs in the last 30 days. Check the entries and receipts; this is a pattern to review, not a recommendation to cut spending.`, evidence: `${money(topCost[1])} � ${share}% of recorded costs`, action: 'Review expenses', href: '/app/transactions' });
  }

  const unclearSales = recent.filter((item) => item.type === 'income' && (!item.taxable || item.taxable === 'unsure')).length;
  if (unclearSales && signals.length < 3) signals.push({ id: 'tax-review', tone: 'amber', title: 'Some sales need tax classification', body: `${unclearSales} confirmed sale${unclearSales === 1 ? '' : 's'} still ${unclearSales === 1 ? 'has' : 'have'} an unresolved tax label. Keep the source records and review classification with Finance or ZRA before filing.`, evidence: `${unclearSales} unresolved labels`, action: 'Open tax readiness', href: '/app/tax' });

  if (signals.length < 3 && profile?.goals?.length) {
    const labels = { records: 'record keeping', profit: 'profit visibility', cashflow: 'cash flow', tax_ready: 'tax readiness', growth: 'business growth' };
    const focus = profile.goals.slice(0, 2).map((goal) => labels[goal]).filter(Boolean).join(' and ');
    if (focus) signals.push({ id: 'business-focus', tone: 'teal', title: `Your focus: ${focus}`, body: `I'll shape business signals around ${profile.businessName || 'your business'} and the goals you chose. Add and confirm records to make those signals more useful.`, evidence: `${profile.operatingDaysPerWeek || 6} trading days � ${profile.language || 'English'} preference`, action: 'Update business profile', href: '/app/profile' });
  }

  return signals.slice(0, 3);
}

