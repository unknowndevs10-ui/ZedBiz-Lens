import { useEffect, useRef, useState } from 'react';
import { Camera, Check, ClipboardPaste, Mic, Plus, ReceiptText, Smartphone, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EntryBox from '../components/transactions/EntryBox';
import MomoBatchPanel from '../components/transactions/MomoBatchPanel';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { inspectReceipt } from '../services/aiEngine';
import { formatKwacha } from '../utils/format';
import { parseMobileMoneySms } from '../services/momoParser';
import { saveReceiptPhoto } from '../services/receiptArchive';
import { useAuth } from '../context/AuthContext';

export default function CapturePage() {
  const { businessId, businessProfile, transactions, submitEntry, submitAgentDraft, isSyntheticDemo } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [extraction, setExtraction] = useState(null);
  const [receiptAlerts, setReceiptAlerts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseType, setPurchaseType] = useState('stock');
  const [allowReceiptService, setAllowReceiptService] = useState(false);
  const [tab, setTab] = useState('note');
  const [sms, setSms] = useState('');
  const [smsDraft, setSmsDraft] = useState(null);
  const [smsError, setSmsError] = useState('');

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  async function scanReceipt(nextFile) {
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) return toast('Choose a JPG, PNG or WebP receipt image.', { tone: 'warning' });
    if (nextFile.size > 8 * 1024 * 1024) return toast('Choose an image smaller than 8 MB.', { tone: 'warning' });
    setFile(nextFile); setExtraction(null); setReceiptAlerts([]); setBusy(true);
    setImageUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(nextFile); });
    try {
      const serviceConfigured = Boolean(String(import.meta.env.VITE_ENGINE_API_URL || '').trim());
      const resultBundle = serviceConfigured && !allowReceiptService
        ? { extraction: { supplier: '', date: new Date().toISOString().slice(0, 10), line_items: [], cogs_amount: 0, expense_amount: 0, total_zmw: 0, confidence: 0, smart_invoice_valid: null, supplier_tpin_verified: null, input_vat_amount: null, source: 'manual-entry' }, alerts: [] }
        : await inspectReceipt(nextFile, transactions);
      const { extraction: result, alerts } = resultBundle;
      setExtraction(result);
      setReceiptAlerts(alerts);
      setSupplier(result.source === 'donut-live' ? result.supplier : '');
      setAmount(result.source === 'donut-live' ? String(result.total_zmw) : '');
      setPurchaseType(result.source === 'donut-live' && result.cogs_amount > 0 && result.expense_amount > 0 ? 'mixed' : result.source === 'donut-live' && result.cogs_amount <= 0 ? 'expense' : 'stock');
    } catch (error) {
      setExtraction({ supplier: '', date: new Date().toISOString().slice(0, 10), line_items: [], cogs_amount: 0, expense_amount: 0, total_zmw: 0, confidence: 0, smart_invoice_valid: null, supplier_tpin_verified: null, input_vat_amount: null, source: 'manual-entry' });
      setSupplier(''); setAmount(''); setPurchaseType('stock');
      toast(`${error.message || 'Receipt service is unavailable.'} Enter the values from your photo manually; nothing was guessed.`, { tone: 'info', title: 'Manual receipt entry ready' });
    }
    finally { setBusy(false); }
  }

  async function queueReceipt() {
    if (!extraction || !supplier.trim() || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const total = Number(amount);
      const stockCost = purchaseType === 'stock' ? total : purchaseType === 'mixed' ? Number(extraction.cogs_amount) : 0;
      const operatingCost = purchaseType === 'expense' ? total : purchaseType === 'mixed' ? Number(extraction.expense_amount) : 0;
      if (purchaseType === 'mixed' && Math.abs(stockCost + operatingCost - total) > 0.01) {
        toast('For a mixed receipt, stock cost plus other business costs must match the receipt total.', { tone: 'warning' });
        setBusy(false);
        return;
      }
      if (stockCost <= 0 && operatingCost <= 0) {
        toast('Enter a positive amount for the receipt before adding a review draft.', { tone: 'warning' });
        setBusy(false);
        return;
      }
      let receiptAttachmentId = null;
      if (file) {
        try { receiptAttachmentId = await saveReceiptPhoto(file, user?.id || 'guest'); }
        catch { toast('Receipt details can still be saved, but this browser could not retain the photo.', { tone: 'warning' }); }
      }
      const lineSummary = extraction.line_items.map((item) => `${item.description} x${item.quantity} ${formatKwacha(item.amount)}`).join('; ');
      const receiptReference = file?.name ? `Photo: ${file.name}.` : 'Photo captured in this session.';
      const common = { date: extraction.date || new Date().toISOString().slice(0, 10), confidence: extraction.source === 'donut-live' ? extraction.confidence : null, counterparty: supplier.trim(), source: extraction.source === 'donut-live' ? 'Receipt vision service · owner reviewed' : `Receipt photo · owner entered details · ${receiptReference}`, receiptAttachmentId, receiptImageName: receiptAttachmentId ? file?.name : null, smartInvoiceValid: extraction.source === 'donut-live' ? extraction.smart_invoice_valid === true : null, supplierTpinVerified: extraction.source === 'donut-live' ? extraction.supplier_tpin_verified === true : null, inputVatAmount: extraction.source === 'donut-live' ? extraction.input_vat_amount : null, inputInvoiceDate: extraction.date || null };
      const lineDescription = lineSummary ? ` Items: ${lineSummary}.` : '';
      const lineItem = extraction.line_items.find((item) => Number(item.amount) > 0);
      if (stockCost > 0) {
        const stockDescription = `Stock purchase from ${supplier.trim()}`;
        await submitAgentDraft({ businessId, text: `${receiptReference} ${stockDescription}, ${common.date}, ${formatKwacha(stockCost)}.${lineDescription}`, draft: { type: 'expense', category: 'Stock purchases', description: stockDescription, amount: stockCost, ...common, itemName: lineItem?.description, unitCost: lineItem?.unit_price, quantity: lineItem?.quantity } });
      }
      if (operatingCost > 0) {
        const expenseDescription = `Business costs from ${supplier.trim()}`;
        // A mixed invoice is represented by two ledger drafts. Keep invoice-level
        // VAT evidence on only one draft so the same supplier VAT is not counted twice.
        const invoiceTaxEvidence = stockCost > 0
          ? { smartInvoiceValid: false, supplierTpinVerified: false, inputVatAmount: null }
          : {};
        await submitAgentDraft({ businessId, text: `${receiptReference} ${expenseDescription}, ${common.date}, ${formatKwacha(operatingCost)}.`, draft: { type: 'expense', category: 'Other expenses', description: expenseDescription, amount: operatingCost, ...common, ...invoiceTaxEvidence } });
      }
      toast(purchaseType === 'mixed' ? 'Two receipt drafts are waiting for owner review.' : 'Receipt draft is waiting for owner review.');
      navigate('/app/transactions');
    } catch (error) { toast(error.message || 'Could not add the draft.', { tone: 'danger' }); }
    finally { setBusy(false); }
  }

  function parseSms() {
    const result = parseMobileMoneySms(sms);
    setSmsError(result.ok ? '' : result.reason);
    setSmsDraft(result.ok ? result : null);
  }

  async function queueSmsDraft() {
    if (!smsDraft || !smsDraft.direction || Number(smsDraft.amount) <= 0) return;
    setBusy(true);
    try {
      await submitAgentDraft({
        businessId,
        text: `Mobile-money ${smsDraft.direction} record${smsDraft.reference ? ` ${smsDraft.reference}` : ''}`,
        draft: {
          type: smsDraft.direction,
          category: smsDraft.direction === 'income' ? 'Sales' : 'Other expenses',
          description: `${smsDraft.direction === 'income' ? 'Mobile-money receipt' : 'Mobile-money payment'}${smsDraft.counterparty ? ` · ${smsDraft.counterparty}` : ''}`,
          amount: Number(smsDraft.amount), date: new Date().toISOString().slice(0, 10),
          confidence: smsDraft.confidence, paymentMethod: 'mobile_money',
          reference: smsDraft.reference, counterparty: smsDraft.counterparty, feeAmount: smsDraft.feeAmount,
        },
      });
      setSms(''); setSmsDraft(null); setSmsError('');
      toast('Mobile-money entry is waiting for your review.');
      navigate('/app/transactions');
    } catch (error) { toast(error.message || 'Could not add the mobile-money draft.', { tone: 'danger' }); }
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

  function addReceiptLine() {
    setExtraction((current) => current ? { ...current, line_items: [...current.line_items, { description: '', quantity: 1, unit_price: 0, amount: 0 }] } : current);
  }

  function clearReceipt() {
    setFile(null); setImageUrl(''); setExtraction(null); setReceiptAlerts([]); setSupplier(''); setAmount(''); setPurchaseType('stock');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return <main className="mx-auto max-w-4xl">
    <header className="mb-7"><p className="eyebrow">CAPTURE</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Record what happened.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Snap a receipt, speak a note or type it. Every result stays a draft until you review and confirm it.</p></header>
    <div>
      <div role="tablist" aria-label="Capture method" className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-[#EDF3F1] p-1">
        {[
          ['note', 'Voice or text', Mic],
          ['receipt', 'Receipt photo', Camera],
          ['momo', 'Paste MoMo SMS', Smartphone],
          ['momo-batch', 'Batch MoMo SMS', ClipboardPaste],
        ].map(([id, label, Icon]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs font-bold ${tab === id ? 'bg-white text-brand-700 shadow-card' : 'text-ink-muted hover:text-ink'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </div>
      <div className="mt-4">
      {tab === 'receipt' && <Card className="max-w-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between"><div><p className="eyebrow">01 / RECEIPT</p><h2 className="mt-2 text-lg font-extrabold">Capture a supplier receipt</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Take a photo or choose an image. If receipt vision is unavailable, enter the details from your photo. Nothing is guessed.</p></div><Camera className="h-5 w-5 text-brand-700" /></div>
        {Boolean(String(import.meta.env.VITE_ENGINE_API_URL || '').trim()) && <label className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-xs leading-5 text-ink-muted"><input type="checkbox" checked={allowReceiptService} onChange={(event) => setAllowReceiptService(event.target.checked)} className="mt-1 accent-[#185C58]" /><span>Allow this receipt image to be sent to the configured extraction service for suggestions. You will review all fields. Leave unchecked to keep the image in this browser and enter details manually.</span></label>}
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface p-5 text-center transition-colors hover:border-brand-500"><Upload className="h-5 w-5 text-brand-700" /><span className="mt-2 text-sm font-bold">Use camera or choose a receipt</span><span className="mt-1 text-xs text-ink-muted">JPG, PNG or WebP · up to 8 MB</span><input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy || isSyntheticDemo} onChange={(event) => scanReceipt(event.target.files?.[0])} /></label>
        {busy && <div className="mt-4 rounded-lg border border-line bg-surface p-3" role="status"><p className="text-xs font-bold text-ink">Preparing your receipt for review</p><ol className="mt-2 grid gap-2 text-[11px] text-ink-muted sm:grid-cols-3"><li>01 · Open the receipt image</li><li>02 · Check captured details</li><li>03 · Keep every value editable</li></ol><p className="mt-2 text-[10px] text-ink-muted">A connected extraction service may suggest fields. You review them before saving a draft.</p></div>}
        {file && <div className="mt-3 flex items-center justify-between gap-3"><p className="truncate text-xs text-ink-muted">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p><button type="button" onClick={clearReceipt} className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-bold text-ink-muted hover:bg-surface focus-ring"><X className="h-3.5 w-3.5" />Remove</button></div>}
        {imageUrl && <img src={imageUrl} alt="Selected receipt preview" className="mt-3 max-h-48 w-full rounded-lg border border-line object-contain" />}
        {extraction && <div className="mt-4 border-t border-line pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700">{extraction.source === 'donut-live' ? 'Service extraction · review every field' : 'Manual receipt entry'}</p>
          {extraction.source === 'manual-entry' && <p className="mt-2 rounded-md border border-accent-100 bg-accent-50 p-3 text-xs leading-5 text-ink-muted">No receipt-reading service is connected. Read your photo and enter the values below. These details will be saved as a pending draft for your review.</p>}
          {extraction.source === 'donut-live' && <p className="mt-2 text-[11px] leading-5 text-ink-muted">Smart Invoice: {extraction.smart_invoice_valid === null ? 'not reported' : extraction.smart_invoice_valid ? 'reported valid by service' : 'reported invalid'} · Supplier TPIN: {extraction.supplier_tpin_verified === null ? 'not verified by service' : extraction.supplier_tpin_verified ? 'reported verified' : 'not verified'}. ZedBiz does not independently validate ZRA records.</p>}
          {receiptAlerts.map((alert) => <p key={alert.item} className="mt-2 rounded-md border border-accent-100 bg-accent-50 p-3 text-xs leading-5 text-ink-muted">Price check for {alert.item}: recorded unit price is {alert.percentIncrease}% above the last confirmed purchase. Check receipt and quantity before acting.</p>)}
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-muted">Supplier<input className="field mt-1 h-10" maxLength={100} value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Name shown on receipt" /></label><label className="text-xs font-semibold text-ink-muted">Receipt date<input className="field mt-1 h-10" type="date" value={extraction.date || ''} onChange={(event) => updateExtraction('date', event.target.value)} /></label><label className="text-xs font-semibold text-ink-muted">This receipt is for<select className="field mt-1 h-10" value={purchaseType} onChange={(event) => setPurchaseType(event.target.value)}><option value="stock">Stock or goods for resale</option><option value="expense">Operating expense</option><option value="mixed">Stock and other business costs</option></select></label><label className="text-xs font-semibold text-ink-muted">Total (ZMW)<input className="field mt-1 h-10 tabular-nums" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>{purchaseType === 'mixed' && <><label className="text-xs font-semibold text-ink-muted">Stock cost / COGS (ZMW)<input className="field mt-1 h-10 tabular-nums" type="number" min="0" step="0.01" inputMode="decimal" value={extraction.cogs_amount || ''} onChange={(event) => updateExtraction('cogs_amount', Number(event.target.value))} placeholder="0.00" /></label><label className="text-xs font-semibold text-ink-muted">Other business cost (ZMW)<input className="field mt-1 h-10 tabular-nums" type="number" min="0" step="0.01" inputMode="decimal" value={extraction.expense_amount || ''} onChange={(event) => updateExtraction('expense_amount', Number(event.target.value))} placeholder="0.00" /></label></>}</div>
            <div className="mt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold">Receipt line items <span className="font-normal text-ink-muted">(optional)</span></p><p className="mt-1 text-[10px] text-ink-muted">Item prices help compare future supplier receipts.</p></div><Button size="sm" variant="secondary" icon={Plus} onClick={addReceiptLine}>Add item</Button></div><div className="mt-2 space-y-2">{extraction.line_items.map((item, index) => <div key={`${index}-${item.description}`} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_5rem_7rem]"><label className="text-[11px] font-semibold text-ink-muted">Description<input className="field mt-1 h-9" maxLength={100} value={item.description} onChange={(event) => updateLineItem(index, 'description', event.target.value)} /></label><label className="text-[11px] font-semibold text-ink-muted">Qty<input className="field mt-1 h-9" type="number" min="0" step="any" value={item.quantity} onChange={(event) => updateLineItem(index, 'quantity', Number(event.target.value))} /></label><label className="text-[11px] font-semibold text-ink-muted">Unit price<input className="field mt-1 h-9" type="number" min="0" step="any" value={item.unit_price} onChange={(event) => updateLineItem(index, 'unit_price', Number(event.target.value))} /></label></div>)}</div></div>
            {extraction.source === 'donut-live' && <p className="mt-3 text-[11px] text-ink-muted">Line item total {formatKwacha(extraction.line_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} · service confidence {Math.round((Number(extraction.confidence) || 0) * 100)}% (review required)</p>}
            <p className="mt-3 text-[10px] leading-5 text-ink-muted">The receipt photo is saved in this browser and attached to the pending draft. It is not synced to cloud storage in this prototype. If a vision endpoint is configured, the image is also sent to that service; otherwise, you enter the values yourself.</p>
            <Button className="mt-4 w-full" icon={Check} loading={busy} disabled={isSyntheticDemo || !file || !supplier.trim() || Number(amount) <= 0} onClick={queueReceipt}>Add receipt draft for review</Button>
          </>
        </div>}
        {isSyntheticDemo && <p className="mt-3 text-xs text-ink-muted">Return to your live ledger to add or edit entries.</p>}
      </Card>}
      {tab === 'note' && <Card className="max-w-2xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">VOICE OR TEXT</p><h2 className="mt-2 text-lg font-extrabold">Describe the day</h2><p className="mt-1 text-xs leading-5 text-ink-muted">For example: "Sold 15 crates for K2,250, paid K180 transport."</p></div><Mic className="h-5 w-5 text-brand-700" /></div><div className="mt-5"><EntryBox id="capture-note" language={businessProfile?.language || 'English'} onSubmit={submitEntry} /></div><div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[11px] leading-5 text-ink-muted"><ReceiptText className="h-4 w-4 shrink-0" />Type or browser speech recognition creates a reviewable draft.</div></Card>}
      {tab === 'momo' && <Card className="max-w-2xl p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">MOBILE MONEY</p><h2 className="mt-2 text-lg font-extrabold">Paste a transaction SMS</h2><p className="mt-1 max-w-xl text-xs leading-5 text-ink-muted">Works locally with labelled Kwacha amounts from Airtel Money, MTN MoMo or Zamtel Kwacha messages. The original message is not saved or sent to an AI service.</p></div><ClipboardPaste className="h-5 w-5 text-brand-700" /></div>
        <label htmlFor="momo-sms" className="mt-5 block text-xs font-bold">SMS text</label><textarea id="momo-sms" className="field mt-1 min-h-28 py-3" maxLength={1200} value={sms} onChange={(event) => { setSms(event.target.value); setSmsError(''); setSmsDraft(null); }} placeholder="Paste the transaction message here" />
        {smsError && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{smsError}</p>}
        <Button className="mt-3" variant="secondary" disabled={!sms.trim() || isSyntheticDemo} onClick={parseSms}>Read transaction details</Button>
        {smsDraft && <div className="mt-5 border-t border-line pt-4"><p className="text-[10px] font-extrabold uppercase tracking-widest text-accent">Review the extracted draft</p><div className="mt-3 flex flex-wrap gap-2">{[['income','Money received'],['expense','Money sent']].map(([value,label])=><button key={value} type="button" aria-pressed={smsDraft.direction===value} onClick={()=>setSmsDraft((current)=>({...current,direction:value}))} className={`rounded-full border px-3 py-2 text-xs font-bold ${smsDraft.direction===value?'border-brand bg-brand-50 text-brand-700':'border-line text-ink-muted'}`}>{label}</button>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-muted">Amount (ZMW)<input className="field mt-1 h-10" type="number" min="0" step="0.01" value={smsDraft.amount} onChange={(event)=>setSmsDraft((current)=>({...current,amount:event.target.value}))} /></label><label className="text-xs font-semibold text-ink-muted">Mobile-money fee (separate)<input className="field mt-1 h-10" type="number" min="0" step="0.01" value={smsDraft.feeAmount ?? ''} onChange={(event)=>setSmsDraft((current)=>({...current,feeAmount:event.target.value===''?null:Number(event.target.value)}))} /></label><label className="text-xs font-semibold text-ink-muted">Sender or recipient<input className="field mt-1 h-10" maxLength={80} value={smsDraft.counterparty} onChange={(event)=>setSmsDraft((current)=>({...current,counterparty:event.target.value}))} /></label><label className="text-xs font-semibold text-ink-muted">Transaction reference<input className="field mt-1 h-10" maxLength={40} value={smsDraft.reference} onChange={(event)=>setSmsDraft((current)=>({...current,reference:event.target.value}))} /></label></div><p className="mt-3 text-[11px] leading-5 text-ink-muted">The amount and direction are still your decision. Fees are recorded separately and are not added to sales or deducted as expenses automatically.</p><Button className="mt-4 w-full" icon={Check} loading={busy} disabled={isSyntheticDemo || !smsDraft.direction || Number(smsDraft.amount)<=0} onClick={queueSmsDraft}>Add review draft</Button></div>}
        {isSyntheticDemo && <p className="mt-3 text-xs text-ink-muted">Return to your live ledger to add or edit entries.</p>}
      </Card>}
      {tab === 'momo-batch' && <MomoBatchPanel businessId={businessId} isSyntheticDemo={isSyntheticDemo} submitAgentDraft={submitAgentDraft} onComplete={(count) => { toast(`${count} mobile-money drafts are waiting for owner review.`); navigate('/app/transactions'); }} />}
      </div>
    </div>
  </main>;
}
