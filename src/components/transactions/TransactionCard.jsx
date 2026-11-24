import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ConfidenceMeter from './ConfidenceMeter';
import TaxLabel from './TaxLabel';
import ReceiptAttachmentPreview from './ReceiptAttachmentPreview';
import { formatDate, formatKwacha } from '../../utils/format';

/** One extracted line awaiting a decision. */
export default function TransactionCard({ transaction, onConfirm, onEdit, onReject }) {
  const [busy, setBusy] = useState(null);
  const isIncome = transaction.type === 'income';

  async function run(kind, action) {
    setBusy(kind);
    try {
      await action(transaction);
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="flex flex-col rounded-lg border border-line bg-[#121a1b] p-4 shadow-card" aria-label={`${transaction.description}, ${formatKwacha(transaction.amount)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={isIncome ? 'success' : 'neutral'}>{isIncome ? 'Income' : 'Expense'}</Badge>
          <Badge tone="brand">{transaction.category}</Badge>
        </div>
        <p className={`text-lg font-extrabold tabular-nums ${isIncome ? 'text-success' : 'text-ink'}`}>
          {isIncome ? '+' : '-'}{formatKwacha(transaction.amount)}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold">{transaction.description}</p>
      <TaxLabel transaction={transaction} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-ink-muted">{formatDate(transaction.date)}</span>
        <ConfidenceMeter value={transaction.confidence} />
      </div>
      {transaction.receiptAttachmentId && <ReceiptAttachmentPreview attachmentId={transaction.receiptAttachmentId} name={transaction.receiptImageName} />}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
        <Button size="sm" icon={Check} loading={busy === 'confirm'} disabled={Boolean(busy)} onClick={() => run('confirm', onConfirm)}>Confirm</Button>
        <Button size="sm" variant="secondary" icon={Pencil} disabled={Boolean(busy)} onClick={() => onEdit(transaction)}>Edit</Button>
        <Button size="sm" variant="danger" icon={X} loading={busy === 'reject'} disabled={Boolean(busy)} onClick={() => run('reject', onReject)} className="ml-auto">Reject</Button>
      </div>
    </article>
  );
}
