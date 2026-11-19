import Card, { CardHeader } from '../common/Card';
import { formatDate, formatKwacha, formatPercent } from '../../utils/format';

function plainSentence(data) {
  const { summary, deltas, period } = data;
  if (deltas && deltas.netProfit !== null) {
    const dir = deltas.netProfit >= 0 ? 'up' : 'down';
    return `Net profit is ${formatKwacha(summary.netProfit)}, ${dir} ${Math.abs(deltas.netProfit).toFixed(1)}% on the previous ${period.label}.`;
  }
  return `Net profit for this period is ${formatKwacha(summary.netProfit)} on ${formatKwacha(summary.sales)} of sales.`;
}

export default function PerformanceSummary({ data }) {
  const { insights } = data;
  const rows = [
    ['Best sales day', insights.bestDay ? `${formatKwacha(insights.bestDay.amount)} on ${formatDate(insights.bestDay.date)}` : 'No sales yet'],
    ['Average daily sales', formatKwacha(insights.averageDailySales)],
    ['Largest expense', insights.topExpense ? `${insights.topExpense.category} (${formatPercent(insights.topExpense.share, 0)} of expenses)` : 'No expenses yet'],
    ['Expenses as share of sales', insights.expenseRatio === null ? 'No sales yet' : formatPercent(insights.expenseRatio, 0)],
  ];
  return (
    <Card>
      <CardHeader title="Performance summary" description={plainSentence(data)} />
      <dl className="mt-3 divide-y divide-line px-4 pb-2 sm:px-5">
        {rows.map(([term, detail]) => (
          <div key={term} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3">
            <dt className="text-[13px] font-semibold text-ink-muted">{term}</dt>
            <dd className="text-sm font-bold tabular-nums">{detail}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
