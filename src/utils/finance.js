// Pure calculation helpers used by the MOCK API (and by nothing else).
// In live mode the backend owns these numbers; the UI only renders what it receives.
import { addDays, diffDays, formatShortDate, todayISO } from './format';
import { TAX_DEMO } from '../data/taxDemo';

export const PERIODS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];
export const COGS_CATEGORY = 'Stock purchases';
export const getPeriod = (id) => PERIODS.find((p) => p.id === id) || PERIODS[1];

const inRange = (tx, start, end) => tx.date >= start && tx.date <= end;
const round2 = (n) => Math.round(n * 100) / 100;

export function summarize(transactions) {
  let sales = 0;
  let expenses = 0;
  let cogs = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') sales += tx.amount;
    else {
      expenses += tx.amount;
      if (tx.category === COGS_CATEGORY) cogs += tx.amount;
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
    else bucket.expenses += tx.amount;
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
    if (tx.type === 'expense') byCategory.set(tx.category, (byCategory.get(tx.category) || 0) + tx.amount);
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

/** Illustrative tax view built from TAX_DEMO placeholder assumptions. Not official. */
export function buildTaxPosition(confirmed) {
  const end = todayISO();
  const start = addDays(end, -(TAX_DEMO.basisDays - 1));
  const inWindow = confirmed.filter((tx) => inRange(tx, start, end));
  // Income labelled 'not_taxable' is left out of turnover. Unlabelled and 'unsure' income still counts.
  const basis = inWindow.filter((tx) => !(tx.type === 'income' && tx.taxable === 'not_taxable'));
  const unsureCount = basis.filter((tx) => tx.type === 'income' && tx.taxable === 'unsure').length;
  const s = summarize(basis);
  const factor = 365 / TAX_DEMO.basisDays;
  const annualTurnover = s.sales * factor;
  const annualNet = Math.max(0, s.netProfit) * factor;
  const annualGross = Math.max(0, s.grossProfit) * factor;
  const [low, high] = TAX_DEMO.turnoverBand;
  const percent = (annualTurnover / TAX_DEMO.vatThreshold) * 100;
  const vatStatus = percent >= 100 ? 'above' : percent >= 75 ? 'approaching' : 'below';

  const regimes = [
    {
      id: 'turnover',
      name: 'Turnover-based',
      basis: 'Share of turnover',
      rateLabel: `${low * 100}% to ${high * 100}% (placeholder)`,
      annualLow: round2(annualTurnover * low),
      annualHigh: round2(annualTurnover * high),
      applicable: true,
      note: 'Simple to track: it only needs sales records.',
    },
    {
      id: 'profit',
      name: 'Profit-based',
      basis: 'Share of net profit',
      rateLabel: `${TAX_DEMO.profitRate * 100}% (placeholder)`,
      annualLow: round2(annualNet * TAX_DEMO.profitRate),
      annualHigh: round2(annualNet * TAX_DEMO.profitRate),
      applicable: true,
      note: 'Needs complete expense records to be meaningful.',
    },
    {
      id: 'vat',
      name: 'VAT-registered',
      basis: 'Share of value added (sales less stock)',
      rateLabel: `${TAX_DEMO.vatRate * 100}% (placeholder)`,
      annualLow: round2(annualGross * TAX_DEMO.vatRate),
      annualHigh: round2(annualGross * TAX_DEMO.vatRate),
      applicable: vatStatus !== 'below',
      note: vatStatus === 'below' ? 'Not shown as applicable while below the illustrative threshold.' : 'Illustrative net amount after stock costs.',
    },
  ];
  const comparable = regimes.filter((r) => r.applicable);
  const mid = (r) => (r.annualLow + r.annualHigh) / 2;
  const lowest = comparable.length > 1 ? comparable.reduce((a, b) => (mid(b) < mid(a) ? b : a)).id : null;

  const notifications = [];
  if (!basis.length) {
    notifications.push({ id: 'no-data', tone: 'warning', title: 'No confirmed entries in the last 90 days', body: 'Confirm some entries to see an illustrative estimate.' });
  } else {
    notifications.push({ id: 'records', tone: 'success', title: `${basis.length} confirmed entries support this view`, body: 'Estimates are rebuilt each time you confirm or edit an entry.' });
  }
  if (vatStatus === 'below') {
    notifications.push({ id: 'vat', tone: 'info', title: 'Below the illustrative VAT threshold', body: `At the current pace, annual turnover is about ${Math.round(percent)}% of the placeholder threshold.` });
  } else {
    notifications.push({ id: 'vat', tone: 'warning', title: vatStatus === 'above' ? 'Above the illustrative VAT threshold' : 'Approaching the illustrative VAT threshold', body: `At the current pace, annual turnover is about ${Math.round(percent)}% of the placeholder threshold.` });
  }
  if (unsureCount) {
    notifications.push({ id: 'unsure', tone: 'warning', title: `${unsureCount} income ${unsureCount === 1 ? 'entry needs' : 'entries need'} a tax label`, body: 'These are counted in turnover for now. Edit each one in Transactions to mark it taxable or not taxable.' });
  }
  notifications.push({ id: 'pending-approval', tone: 'info', title: 'Rates are placeholders', body: 'Official rates and thresholds are pending Finance team approval.' });

  return {
    basis: { start, end, days: TAX_DEMO.basisDays, transactionCount: basis.length },
    turnover: { period: round2(s.sales), annualised: round2(annualTurnover) },
    turnoverEstimate: { low: round2(s.sales * low), high: round2(s.sales * high) },
    vat: {
      threshold: TAX_DEMO.vatThreshold,
      annualisedTurnover: round2(annualTurnover),
      percent,
      remaining: round2(Math.max(0, TAX_DEMO.vatThreshold - annualTurnover)),
      status: vatStatus,
    },
    regimes,
    lowestRegimeId: lowest,
    notifications,
    changes: TAX_DEMO.changes,
    disclaimer: TAX_DEMO.disclaimer,
  };
}
