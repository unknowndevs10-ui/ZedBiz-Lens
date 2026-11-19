import Badge from '../common/Badge';

export const TAX_OPTIONS = [
  { value: 'taxable', label: 'Taxable' },
  { value: 'not_taxable', label: 'Not taxable' },
  { value: 'unsure', label: 'Unsure' },
];
const TONES = { taxable: 'brand', not_taxable: 'neutral', unsure: 'amber' };

/** Tax label for an income line. Demo label, not tax advice. */
export default function TaxLabel({ transaction }) {
  if (transaction.type !== 'income' || !transaction.taxable) return null;
  const option = TAX_OPTIONS.find((o) => o.value === transaction.taxable);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge tone={TONES[transaction.taxable]}>{option?.label}</Badge>
      {transaction.taxReason && <span className="text-[13px] text-ink-muted">{transaction.taxReason}</span>}
    </div>
  );
}
