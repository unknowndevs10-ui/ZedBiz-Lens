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

/** Illustrative tax-readiness view. No final tax decision is made here. */
export function buildTaxPosition(confirmed) {
  const end = todayISO();
  const start = addDays(end, -(TAX_DEMO.basisDays - 1));
  const inWindow = confirmed.filter((tx) => inRange(tx, start, end));
  // Income labelled 'not_taxable' is left out of turnover. Unlabelled and 'unsure' income still counts.
  const basis = inWindow.filter((tx) => !(tx.type === 'income' && tx.taxable === 'not_taxable'));
  const unsureCount = basis.filter((tx) => tx.type === 'income' && tx.taxable === 'unsure').length;
  const s = summarize(basis);
  const annualTurnover = s.sales * (365 / TAX_DEMO.basisDays);
  const { annualCeiling, annualNilBand, rate, modes } = TAX_DEMO.turnoverTax;
  const { annualThreshold: vatThreshold, watchPointPercent } = TAX_DEMO.vat;
  const percent = vatThreshold > 0 ? (annualTurnover / vatThreshold) * 100 : 0;
  const vatStatus = percent >= 100 ? 'above' : percent >= watchPointPercent ? 'approaching' : 'below';
  const aboveTurnoverCeiling = annualTurnover > annualCeiling;
  const turnoverTaxOptions = aboveTurnoverCeiling
    ? null
    : {
        excess_only: round2(Math.max(0, annualTurnover - annualNilBand) * rate),
        total_turnover: round2(annualTurnover > annualNilBand ? annualTurnover * rate : 0),
      };

  const regimes = [
    {
      id: 'turnover',
      name: 'Turnover tax',
      basis: 'Gross sales / turnover',
      rateLabel: `${rate * 100}% reference rate`,
      estimateTitle: 'Alternative annual scenarios',
      scenarios: turnoverTaxOptions && modes.map((mode) => ({
        label: mode === 'excess_only' ? 'Above nil band' : 'Full turnover after nil band',
        amount: turnoverTaxOptions[mode],
      })),
      note: aboveTurnoverCeiling
        ? 'Projected turnover exceeds the reference ceiling. Eligibility and transition timing need review; no amount is estimated.'
        : 'Both tax-base interpretations are shown. Finance must confirm the applicable method; neither is selected as final.',
    },
    {
      id: 'income',
      name: 'Income tax',
      basis: 'Taxable profit after allowable deductions',
      rateLabel: 'Not calculated',
      estimateTitle: 'Estimate',
      scenarios: null,
      note: 'Requires legal form, activity, allowable deductions, and the applicable income-tax schedule. No liability is inferred from net profit.',
    },
    {
      id: 'vat',
      name: 'VAT',
      basis: 'Output VAT less allowable input VAT',
      rateLabel: `${TAX_DEMO.vat.standardRate * 100}% standard-rate reference`,
      estimateTitle: 'VAT payable',
      scenarios: null,
      note: 'Not calculated. Supply classification, output VAT, and allowable input VAT are required. This page only shows a turnover threshold indicator.',
    },
  ];

  const notifications = [];
  if (!basis.length) {
    notifications.push({ id: 'no-data', tone: 'warning', title: 'No confirmed entries in the last 90 days', body: 'Confirm entries to see an illustrative turnover-readiness view.' });
  } else {
    notifications.push({ id: 'records', tone: 'success', title: `${basis.length} confirmed entries support this view`, body: 'The indicator is rebuilt when you confirm or edit an entry.' });
  }
  if (vatStatus === 'below') {
    notifications.push({ id: 'vat', tone: 'info', title: 'Below the VAT threshold marker', body: `Annualised turnover is about ${Math.round(percent)}% of the reference threshold. This is an indicator, not an eligibility decision.` });
  } else {
    notifications.push({ id: 'vat', tone: 'warning', title: vatStatus === 'above' ? 'At or above the VAT threshold marker' : 'Approaching the VAT threshold marker', body: `Annualised turnover is about ${Math.round(percent)}% of the reference threshold. Confirm taxable supplies and registration rules with Finance.` });
  }
  if (unsureCount) {
    notifications.push({ id: 'unsure', tone: 'warning', title: `${unsureCount} income ${unsureCount === 1 ? 'entry needs' : 'entries need'} a tax label`, body: 'These are counted in turnover for now. Edit each one in Transactions to mark it taxable or not taxable.' });
  }
  notifications.push({ id: 'pending-base', tone: 'info', title: 'Turnover-tax base needs confirmation', body: 'The demo shows both excess-only and full-turnover scenarios. Finance must confirm the applicable calculation before integration.' });
  if (aboveTurnoverCeiling) {
    notifications.push({ id: 'turnover-ceiling', tone: 'warning', title: 'Projected turnover is above the reference ceiling', body: 'No turnover-tax amount is shown. Review business activity and transition timing with Finance and ZRA.' });
  }

  return {
    taxYear: TAX_DEMO.taxYear,
    sourceUrl: TAX_DEMO.sourceUrl,
    basis: { start, end, days: TAX_DEMO.basisDays, transactionCount: basis.length },
    turnover: { period: round2(s.sales), annualised: round2(annualTurnover) },
    turnoverEstimate: {
      excessOnly: turnoverTaxOptions?.excess_only ?? null,
      totalTurnover: turnoverTaxOptions?.total_turnover ?? null,
      aboveCeiling: aboveTurnoverCeiling,
    },
    vat: {
      threshold: vatThreshold,
      annualisedTurnover: round2(annualTurnover),
      percent,
      remaining: round2(Math.max(0, vatThreshold - annualTurnover)),
      status: vatStatus,
      watchPointPercent,
    },
    regimes,
    lowestRegimeId: null,
    notifications,
    changes: TAX_DEMO.changes,
    disclaimer: TAX_DEMO.disclaimer,
  };
}


