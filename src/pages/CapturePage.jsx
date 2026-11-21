import { useEffect, useState } from 'react';
import { Camera, Check, Mic, ReceiptText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EntryBox from '../components/transactions/EntryBox';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { extractReceipt, receiptDraft } from '../services/engineAdapter';
import { formatKwacha } from '../utils/format';

export default function CapturePage() {
  const { businessId, businessProfile, submitEntry, submitAgentDraft, isSyntheticDemo } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [extraction, setExtraction] = useState(null);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  async function scanReceipt(nextFile) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/')) return toast('Choose a receipt image file.', { tone: 'warning' });
    if (nextFile.size > 8 * 1024 * 1024) return toast('Choose an image smaller than 8 MB.', { tone: 'warning' });
    setFile(nextFile); setExtraction(null); setBusy(true);
    setImageUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(nextFile); });
    try {
      const result = await extractReceipt(nextFile);
      setExtraction(result);
      // The offline adapter returns a fixture, not OCR from this image.
      // Never prefill a real ledger draft with invented receipt values.
      setSupplier(result.source === 'donut-live' ? result.supplier : '');
      setAmount(result.source === 'donut-live' ? String(result.total_zmw) : '');
    } catch (error) { toast(error.message || 'Receipt extraction failed.', { tone: 'danger' }); }
    finally { setBusy(false); }
  }

  async function queueReceipt() {
    if (!extraction || extraction.source !== 'donut-live' || !supplier.trim() || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const lineSummary = extraction.line_items.map((item) => `${item.description} x${item.quantity} ${formatKwacha(item.amount)}`).join('; ');
      const source = `Receipt from ${supplier.trim()}, ${extraction.date}. Items: ${lineSummary || 'not provided'}. COGS ${formatKwacha(Number(extraction.cogs_amount) || 0)}; other cost ${formatKwacha(Number(extraction.expense_amount) || 0)}; total ${formatKwacha(Number(amount))}.`;
      await submitAgentDraft({ businessId, text: source, draft: { ...receiptDraft(extraction), description: supplier.trim(), amount: Number(amount), source: 'Donut OCR' } });
      toast('Receipt draft is waiting for owner review.');
      navigate('/app/transactions');
    } catch (error) { toast(error.message || 'Could not add the draft.', { tone: 'danger' }); }
    finally { setBusy(false); }
  }

  function updateExtraction(field, value) {
    setExtraction((current) => current ? { ...current, [field]: value } : current);
  }

  function updateLineItem(index, field, value) {
    setExtraction((current) => {
      if (!current) return current;
      const line_items = current.line_items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
      if (['quantity', 'unit_price'].includes(field)) {
        const item = line_items[index];
        item.amount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      }
      return { ...current, line_items };
    });
  }

  return <main className="mx-auto max-w-4xl">
    <header className="mb-7"><p className="eyebrow">CAPTURE</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Record what happened.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Snap a receipt, speak a note or type it. Every result stays a draft until you review and confirm it.</p></header>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between"><div><p className="eyebrow">01 / RECEIPT</p><h2 className="mt-2 text-lg font-extrabold">Snap or upload</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Offline preview stays in this browser. A configured extraction service receives the image.</p></div><Camera className="h-5 w-5 text-brand-700" /></div>
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-[#0e1516] p-5 text-center transition-colors hover:border-brand-500"><Upload className="h-5 w-5 text-brand-700" /><span className="mt-2 text-sm font-bold">Choose a receipt photo</span><span className="mt-1 text-xs text-ink-muted">JPG, PNG or WebP · up to 8 MB</span><input className="sr-only" type="file" accept="image/*" capture="environment" disabled={busy || isSyntheticDemo} onChange={(event) => scanReceipt(event.target.files?.[0])} /></label>
        {busy && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-700" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-700" />Reading receipt fields.</p>}
        {file && <p className="mt-3 truncate text-xs text-ink-muted">{file.name}</p>}
        {imageUrl && <img src={imageUrl} alt="Selected receipt preview" className="mt-3 max-h-48 w-full rounded-lg border border-line object-contain" />}
        {extraction && <div className="mt-4 border-t border-line pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-accent">{extraction.source === 'donut-live' ? 'Receipt service result · review fields' : 'Simulated receipt fixture'}</p>
          {extraction.source === 'donut-simulated' ? <p className="mt-2 rounded-md border border-accent/30 bg-[#1b1913] p-3 text-xs leading-5 text-ink-muted">This sample was not read from your photo. No receipt model is connected, so the example values cannot be saved to your business ledger.</p> : <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-muted">Supplier<input className="field mt-1 h-10" value={supplier} onChange={(event) => setSupplier(event.target.value)} /></label><label className="text-xs font-semibold text-ink-muted">Receipt date<input className="field mt-1 h-10" type="date" value={extraction.date || ''} onChange={(event) => updateExtraction('date', event.target.value)} /></label><label className="text-xs font-semibold text-ink-muted">COGS (ZMW)<input className="field mt-1 h-10 tabular-nums" inputMode="decimal" value={extraction.cogs_amount ?? ''} onChange={(event) => updateExtraction('cogs_amount', Number(event.target.value))} /></label><label className="text-xs font-semibold text-ink-muted">Other expense (ZMW)<input className="field mt-1 h-10 tabular-nums" inputMode="decimal" value={extraction.expense_amount ?? ''} onChange={(event) => updateExtraction('expense_amount', Number(event.target.value))} /></label><label className="text-xs font-semibold text-ink-muted sm:col-span-2">Total (ZMW)<input className="field mt-1 h-10 tabular-nums" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label></div>
            <div className="mt-4"><p className="text-xs font-bold">Line items</p><div className="mt-2 space-y-2">{extraction.line_items.map((item, index) => <div key={`${index}-${item.description}`} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_5rem_7rem]"><label className="text-[11px] font-semibold text-ink-muted">Description<input className="field mt-1 h-9" value={item.description} onChange={(event) => updateLineItem(index, 'description', event.target.value)} /></label><label className="text-[11px] font-semibold text-ink-muted">Qty<input className="field mt-1 h-9" type="number" min="0" step="any" value={item.quantity} onChange={(event) => updateLineItem(index, 'quantity', Number(event.target.value))} /></label><label className="text-[11px] font-semibold text-ink-muted">Unit price<input className="field mt-1 h-9" type="number" min="0" step="any" value={item.unit_price} onChange={(event) => updateLineItem(index, 'unit_price', Number(event.target.value))} /></label></div>)}</div></div>
            <p className="mt-3 text-[11px] text-ink-muted">Extracted line item total {formatKwacha(extraction.line_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} · confidence {Math.round((Number(extraction.confidence) || 0) * 100)}%</p>
            <Button className="mt-4 w-full" icon={Check} loading={busy} disabled={isSyntheticDemo || !supplier.trim() || Number(amount) <= 0} onClick={queueReceipt}>Add draft for review</Button>
          </>}
        </div>}
        {isSyntheticDemo && <p className="mt-3 text-xs text-ink-muted">Return to your live ledger to add or edit entries.</p>}
      </Card>
      <Card className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">02 / VOICE OR TEXT</p><h2 className="mt-2 text-lg font-extrabold">Describe the day</h2><p className="mt-1 text-xs leading-5 text-ink-muted">For example: "Sold 15 crates for K2,250, paid K180 transport."</p></div><Mic className="h-5 w-5 text-brand-700" /></div><div className="mt-5"><EntryBox id="capture-note" language={businessProfile?.language || 'English'} onSubmit={submitEntry} /></div><div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[11px] leading-5 text-ink-muted"><ReceiptText className="h-4 w-4 shrink-0" />Type or browser speech recognition creates a reviewable draft.</div></Card>
    </div>
  </main>;
}
