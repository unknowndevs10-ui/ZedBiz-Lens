import { Pencil } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatKwacha } from '../../utils/format';

const STATUS_TONE = { confirmed: 'success', pending: 'amber', rejected: 'danger' };
const STATUS_LABEL = { confirmed: 'Confirmed', pending: 'Pending', rejected: 'Rejected' };

function Amount({ tx }) {
  const income = tx.type === 'income';
  return (
    <span className={`font-bold tabular-nums ${income ? 'text-success' : 'text-ink'} ${tx.status === 'rejected' ? 'line-through opacity-60' : ''}`}>
      {income ? '+' : '-'}{formatKwacha(tx.amount)}
    </span>
  );
}

/** Table on md+, stacked rows on phones (no horizontal scrolling). */
export default function TransactionTable({ transactions, onEdit, readOnly = false }) {
  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-line text-[13px] text-ink-muted">
            <th scope="col" className="px-5 py-3 font-semibold">Date</th>
            <th scope="col" className="px-3 py-3 font-semibold">Description</th>
            <th scope="col" className="px-3 py-3 font-semibold">Category</th>
            <th scope="col" className="px-3 py-3 font-semibold">Status</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Amount</th>
            <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-line/70 last:border-0 hover:bg-surface/60">
              <td className="whitespace-nowrap px-5 py-3 text-ink-muted">{formatDate(tx.date)}</td>
              <td className="px-3 py-3 font-semibold">{tx.description}</td>
              <td className="px-3 py-3 text-ink-muted">{tx.category}</td>
              <td className="px-3 py-3"><Badge tone={STATUS_TONE[tx.status]}>{STATUS_LABEL[tx.status]}</Badge></td>
              <td className="px-3 py-3 text-right"><Amount tx={tx} /></td>
              <td className="px-5 py-3 text-right">
                {!readOnly && tx.status !== 'rejected' && (
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(tx)} aria-label={`Edit ${tx.description}`}>Edit</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line md:hidden">
        {transactions.map((tx) => (
          <li key={tx.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-semibold">{tx.description}</p>
              <Amount tx={tx} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
              <span>{formatDate(tx.date)}</span>
              <span aria-hidden="true">�</span>
              <span>{tx.category}</span>
              <Badge tone={STATUS_TONE[tx.status]} className="ml-auto">{STATUS_LABEL[tx.status]}</Badge>
            </div>
            {!readOnly && tx.status !== 'rejected' && (
              <Button size="sm" variant="secondary" icon={Pencil} className="mt-2.5" onClick={() => onEdit(tx)}>Edit</Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

