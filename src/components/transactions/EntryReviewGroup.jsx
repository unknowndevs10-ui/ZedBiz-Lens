import { useState } from 'react';
import { CheckCheck, Quote } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import TransactionCard from './TransactionCard';
import { formatKwacha } from '../../utils/format';

/** The original note plus every line extracted from it. */
export default function EntryReviewGroup({ source, items, onConfirm, onEdit, onReject, onConfirmAll, onRejectAll }) {
  const [busy, setBusy] = useState(null);
  const income = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  async function bulk(kind, action) {
    setBusy(kind);
    try {
      await action(items.map((t) => t.id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white shadow-card" aria-label="Entry awaiting review">
      <div className="border-b border-line p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-muted">
            <Quote className="h-3.5 w-3.5" aria-hidden="true" /> Original entry
          </p>
          <Badge tone="amber">Simulated extraction</Badge>
        </div>
        <p className="rounded-md bg-surface px-3 py-2.5 text-[15px] leading-relaxed">{source || 'No original text stored.'}</p>
        <p className="mt-3 text-[13px] text-ink-muted">
          {items.length} {items.length === 1 ? 'line' : 'lines'} found · {formatKwacha(income)} income · {formatKwacha(expense)} expenses
        </p>
      </div>
      <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((tx) => (
          <TransactionCard key={tx.id} transaction={tx} onConfirm={onConfirm} onEdit={onEdit} onReject={onReject} />
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex flex-wrap gap-2 border-t border-line bg-surface/60 px-4 py-3 sm:px-5">
          <Button size="sm" icon={CheckCheck} loading={busy === 'all'} disabled={Boolean(busy)} onClick={() => bulk('all', onConfirmAll)}>Confirm all {items.length}</Button>
          <Button size="sm" variant="danger" loading={busy === 'none'} disabled={Boolean(busy)} onClick={() => bulk('none', onRejectAll)}>Reject all</Button>
        </div>
      )}
    </section>
  );
}
