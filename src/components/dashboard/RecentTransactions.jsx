import { Link } from 'react-router-dom';
import Card, { CardHeader } from '../common/Card';
import { formatDate, formatKwacha } from '../../utils/format';

export default function RecentTransactions({ transactions }) {
  return (
    <Card>
      <CardHeader
        title="Recent transactions"
        action={<Link to="/app/transactions" className="rounded text-[13px] font-semibold text-brand-700 hover:underline focus-ring">View all</Link>}
      />
      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">No confirmed transactions in this period.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line px-4 pb-2 sm:px-5">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{tx.description}</p>
                <p className="text-[13px] text-ink-muted">{tx.category} · {formatDate(tx.date)}</p>
              </div>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-success' : 'text-ink'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatKwacha(tx.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
