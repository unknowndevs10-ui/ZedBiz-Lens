// Pure calculation helpers used by the MOCK API (and by nothing else).
// In live mode the backend owns these numbers; the UI only renders what it receives.
import { addDays, diffDays, formatShortDate, todayISO } from './format';

export const PERIODS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];
export const COGS_CATEGORY = 'Stock purchases';
export const COGS_CATEGORIES = new Set(['Stock purchases', 'Spoilage & wastage']);
export const OWNER_WITHDRAWAL_TYPE = 'owner_withdrawal';
export const getPeriod = (id) => PERIODS.find((p) => p.id === id) || PERIODS[1];

const inRange = (tx, start, end) => tx.date >= start && tx.date <= end;
const round2 = (n) => Math.round(n * 100) / 100;

export function summarize(transactions) {
  let sales = 0;
  let expenses = 0;
  let cogs = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') sales += tx.amount;
    else if (tx.type !== OWNER_WITHDRAWAL_TYPE && tx.category !== 'Owner personal withdrawal') {
      expenses += tx.amount;
      if (COGS_CATEGORIES.has(tx.category)) cogs += tx.amount;
    }
  }
  return {
    sales: round2(sales),
    expenses: round2(expenses),
    grossProfit: round2(sales - cogs),
    netProfit: round2(sales - expenses),
    margin: sales > 0 ? ((sales - expenses) / sales) * 100 : 0,
  };
}

const percentChange = (current, previous) => (previous ? ((current - previous) / Math.abs(previous)) * 100 : null);

function resolveRange(transactions, period) {
  const end = todayISO();
  if (period.days) return { start: addDays(end, -(period.days - 1)), end };
  const first = transactions.reduce((min, tx) => (tx.date < min ? tx.date : min), end);
  return { start: first, end };
}

function buildSeries(transactions, start, end) {
  const span = diffDays(end, start) + 1;
  const size = span <= 31 ? 1 : 7;
  const buckets = Array.from({ length: Math.ceil(span / size) }, (_, i) => ({
    label: formatShortDate(addDays(start, i * size)),
    revenue: 0,
    expenses: 0,
    net: 0,
  }));
  for (const tx of transactions) {
    const bucket = buckets[Math.floor(diffDays(tx.date, start) / size)];
    if (!bucket) continue;
    if (tx.type === 'income') bucket.revenue += tx.amount;
    else if (tx.type !== OWNER_WITHDRAWAL_TYPE && tx.category !== 'Owner personal withdrawal') bucket.expenses += tx.amount;
  }
  return buckets.map((b) => ({ ...b, revenue: round2(b.revenue), expenses: round2(b.expenses), net: round2(b.revenue - b.expenses) }));
}

/** @param confirmed confirmed transactions only */
export function buildDashboard(confirmed, periodId) {
  const period = getPeriod(periodId);
  const { start, end } = resolveRange(confirmed, period);
  const current = confirmed.filter((tx) => inRange(tx, start, end));
  const summary = summarize(current);
  const spanDays = diffDays(end, start) + 1;

  let previous = null;
  let deltas = null;
  if (period.days) {
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(period.days - 1));
    previous = summarize(confirmed.filter((tx) => inRange(tx, prevStart, prevEnd)));
    deltas = {
      sales: percentChange(summary.sales, previous.sales),
      expenses: percentChange(summary.expenses, previous.expenses),
      grossProfit: percentChange(summary.grossProfit, previous.grossProfit),
      netProfit: percentChange(summary.netProfit, previous.netProfit),
      margin: previous.sales > 0 ? summary.margin - previous.margin : null, // percentage points
    };
  }

  const byCategory = new Map();
  const salesByDay = new Map();
  for (const tx of current) {
    if (tx.type === 'expense' && tx.category !== 'Owner personal withdrawal') byCategory.set(tx.category, (byCategory.get(tx.category) || 0) + tx.amount);
    else salesByDay.set(tx.date, (salesByDay.get(tx.date) || 0) + tx.amount);
  }
  const expenseBreakdown = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount), share: summary.expenses ? (amount / summary.expenses) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const bestDayEntry = [...salesByDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const recent = [...current]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 6);

  return {
    period: { id: period.id, label: period.label, start, end, days: spanDays },
    summary,
    previous,
    deltas,
    series: buildSeries(current, start, end),
    expenseBreakdown,
    recent,
    insights: {
      bestDay: bestDayEntry ? { date: bestDayEntry[0], amount: round2(bestDayEntry[1]) } : null,
      averageDailySales: round2(summary.sales / Math.max(spanDays, 1)),
      topExpense: expenseBreakdown[0] || null,
      expenseRatio: summary.sales > 0 ? (summary.expenses / summary.sales) * 100 : null,
    },
    transactionCount: current.length,
  };
}

