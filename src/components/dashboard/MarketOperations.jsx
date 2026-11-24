import { useMemo, useState } from 'react';
import { Coins, PackageX } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardHeader } from '../common/Card';
import { Input } from '../common/FormControls';
import { useToast } from '../../context/ToastContext';
import { formatKwacha, todayISO } from '../../utils/format';

export default function MarketOperations({ businessId, userId, transactions = [], submitAgentDraft, readOnly = false, onCashClose }) {
  const { toast } = useToast();
  const [openingFloat, setOpeningFloat] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [savedClose, setSavedClose] = useState(null);
  const [wasteName, setWasteName] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const cashLines = useMemo(() => transactions.filter((tx) => tx.status === 'confirmed' && tx.date === todayISO() && tx.paymentMethod === 'cash'), [transactions]);
  const cashIn = cashLines.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const cashOut = cashLines.filter((tx) => tx.type !== 'income').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const untagged = transactions.filter((tx) => tx.status === 'confirmed' && tx.date === todayISO() && !['cash', 'mobile_money', 'credit'].includes(tx.paymentMethod)).length;
  const expected = cashLines.length ? Number(openingFloat || savedClose?.opening || 0) + cashIn - cashOut : null;

  async function saveCash(event) {
    event.preventDefault();
    const close = { date: todayISO(), opening: Number(openingFloat || 0), actual: Number(actualCash), savedAt: new Date().toISOString() };
    try {
      const key = `zedbiz-lens:cash-close:v1:${String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_')}:${String(businessId || 'my-business').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      localStorage.setItem(key, JSON.stringify(close));
      setSavedClose(close); onCashClose?.(close);
      toast('Cash count saved on this device.');
    } catch { toast('Could not save this cash count in browser storage.', { tone: 'danger' }); }
  }

  async function logWaste(event) {
    event.preventDefault();
    if (!wasteName.trim() || Number(wasteAmount) <= 0) return;
    setSaving(true);
    try {
      await submitAgentDraft({ businessId, text: `Spoilage log: ${wasteName.trim()} ${formatKwacha(Number(wasteAmount))}`, draft: { type: 'expense', category: 'Spoilage & wastage', description: wasteName.trim(), amount: Number(wasteAmount), date: todayISO(), paymentMethod: 'unspecified', confidence: 1 } });
      toast('Wastage is in your review queue. It will affect profit only after you confirm it.');
      setWasteName(''); setWasteAmount('');
    } catch (error) { toast(error.message || 'Could not log wastage.', { tone: 'danger' }); }
    finally { setSaving(false); }
  }

  return <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Market trader tools">
    <Card>
      <CardHeader title="Evening cash check" description="About 30 seconds · cash records only" action={<Coins className="h-5 w-5 text-brand-700" />} />
      <form onSubmit={saveCash} className="space-y-3 p-4 pt-3 sm:p-5 sm:pt-3">
        <p className="text-xs leading-5 text-ink-muted">Expected closing cash = opening float + confirmed cash sales − confirmed cash expenses and withdrawals. Mobile-money and untagged entries are excluded.</p>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-muted">Cash at opening (ZMW)<Input className="mt-1" type="number" min="0" step="0.01" value={openingFloat || savedClose?.opening || ''} onChange={(event)=>setOpeningFloat(event.target.value)} disabled={readOnly} /></label><label className="text-xs font-semibold text-ink-muted">Cash counted now (ZMW)<Input className="mt-1" type="number" min="0" step="0.01" value={actualCash || savedClose?.actual || ''} onChange={(event)=>setActualCash(event.target.value)} disabled={readOnly} /></label></div>
        {expected === null ? <p className="rounded-md bg-accent-50 p-3 text-xs leading-5 text-accent-800">No confirmed cash-tagged records for today. Tag payment channels in the ledger before using a difference as a reconciliation signal.</p> : <p className="rounded-md bg-brand-50 p-3 text-xs font-semibold leading-5 text-brand-800">Expected: {formatKwacha(expected)} · counted: {actualCash || savedClose?.actual ? formatKwacha(Number(actualCash || savedClose?.actual)) : 'not entered'}{actualCash || savedClose?.actual ? ` · difference ${formatKwacha(Number(actualCash || savedClose?.actual) - expected)}` : ''}</p>}
        {untagged > 0 && <p className="text-[11px] text-ink-muted">{untagged} confirmed entry{untagged === 1 ? ' is' : 'ies are'} missing a payment channel and are excluded.</p>}
        {!readOnly && <Button type="submit" variant="secondary" disabled={actualCash === '' && !savedClose}>Save cash count</Button>}
        {savedClose && <p className="text-[10px] text-ink-muted">Saved locally at {new Date(savedClose.savedAt).toLocaleTimeString()}.</p>}
        {readOnly && <p className="text-[11px] text-ink-muted">Sample workspace is read-only; cash counts are disabled.</p>}
      </form>
    </Card>
    <Card>
      <CardHeader title="Spoilage & wastage" description="Log unsold, damaged or expired produce" action={<PackageX className="h-5 w-5 text-brand-700" />} />
      <form onSubmit={logWaste} className="space-y-3 p-4 pt-3 sm:p-5 sm:pt-3"><label className="block text-xs font-semibold text-ink-muted">What was lost?<Input className="mt-1" value={wasteName} onChange={(event)=>setWasteName(event.target.value)} placeholder="e.g. tomatoes discarded" maxLength={80} disabled={readOnly} /></label><label className="block text-xs font-semibold text-ink-muted">Estimated cost (ZMW)<Input className="mt-1" type="number" min="0" step="0.01" value={wasteAmount} onChange={(event)=>setWasteAmount(event.target.value)} placeholder="0.00" disabled={readOnly} /></label><p className="text-[11px] leading-5 text-ink-muted">Creates a pending cost record. Review it in Ledger before it changes gross or net profit.</p>{!readOnly && <Button type="submit" variant="secondary" loading={saving} disabled={!wasteName.trim() || Number(wasteAmount) <= 0}>Add wastage draft</Button>}{readOnly && <p className="text-[11px] text-ink-muted">Sample workspace is read-only.</p>}</form>
    </Card>
  </section>;
}
