import { useState } from 'react';
import { Check, ClipboardPaste } from 'lucide-react';
import Button from '../common/Button';
import { parseMobileMoneyBatch } from '../../services/momoParser';
import { formatKwacha } from '../../utils/format';

export default function MomoBatchPanel({ businessId, isSyntheticDemo, submitAgentDraft, onComplete }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function parse() {
    const parsed = parseMobileMoneyBatch(text);
    setResult(parsed.ok ? parsed : null);
    setError(parsed.ok ? '' : parsed.reason);
  }

  async function addDrafts() {
    if (!result?.drafts?.length || isSyntheticDemo) return;
    setBusy(true);
    try {
      for (const item of result.drafts) {
        await submitAgentDraft({ businessId, text: item.sourceText, draft: { ...item.draft, aiExplanation: item.explanation, aiSource: 'offline-sms-parser' } });
      }
      onComplete(result.drafts.length);
      setText(''); setResult(null);
    } catch (cause) {
      setError(cause.message || 'Could not add the drafts.');
    } finally { setBusy(false); }
  }

  return <section className="max-w-2xl rounded-xl border border-line bg-[#121a1b] p-5 sm:p-6">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700"><ClipboardPaste className="h-5 w-5" /></span><div><p className="eyebrow">BATCH MOBILE MONEY</p><h2 className="mt-1 text-lg font-extrabold">Read multiple confirmation messages</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Paste up to 20 SMS messages, one per line. The parser separates receipts, payments, transfer fees and personal transfers locally. It does not contact an AI API.</p></div></div>
    <label htmlFor="momo-batch" className="mt-5 block text-xs font-bold">SMS messages</label>
    <textarea id="momo-batch" className="field mt-1 min-h-32 py-3" maxLength={12000} value={text} onChange={(event) => { setText(event.target.value); setError(''); setResult(null); }} placeholder={'Airtel Money received K500 from Mary. Fee K3 Ref ABCD123\nMTN MoMo sent K120 to family for personal use Ref XYZZ998'} />
    {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    <Button className="mt-3" variant="secondary" disabled={!text.trim() || isSyntheticDemo} onClick={parse}>Parse messages locally</Button>
    {result && <div className="mt-5 border-t border-line pt-4"><p className="text-[10px] font-extrabold uppercase tracking-widest text-accent">{result.messageCount} messages · {result.draftCount} pending drafts</p><div className="mt-3 space-y-2">{result.results.map((item) => <article key={item.index} className="rounded-md border border-line p-3"><p className="text-xs font-bold">Message {item.index + 1} · {item.provider} · {item.status}</p><p className="mt-1 text-[11px] leading-5 text-ink-muted">{item.explanation}</p>{item.drafts.map((draft, index) => <p key={index} className="mt-2 text-xs tabular-nums">{draft.draft.type} · {draft.draft.category} · {formatKwacha(draft.draft.amount)}{draft.draft.counterparty ? ` · ${draft.draft.counterparty}` : ''}</p>)}</article>)}</div><p className="mt-3 text-[11px] leading-5 text-ink-muted">Every extracted record remains pending. Review amount, party and purpose before confirming. Personal incoming transfers are excluded from sales; fees remain separate drafts.</p><Button className="mt-4 w-full" icon={Check} loading={busy} disabled={!result.drafts.length || isSyntheticDemo} onClick={addDrafts}>Add pending drafts for owner review</Button></div>}
    {isSyntheticDemo && <p className="mt-3 text-xs text-ink-muted">Return to your business ledger to create real drafts.</p>}
  </section>;
}
