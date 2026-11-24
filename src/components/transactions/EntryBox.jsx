import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff } from 'lucide-react';
import Button from '../common/Button';
import Notification from '../common/Notification';
import { Textarea } from '../common/FormControls';
import { Link } from 'react-router-dom';
import { formatKwacha } from '../../utils/format';

const LANGUAGE_EXAMPLES = [
  { label: 'Nyanja', text: 'Ndagulitsa tomato pa K600, ndagula katundu pa K400, ndalipira transport K50.' },
  { label: 'Bemba', text: 'Nashitisha tomato pa K600, nashita katundu K400, nafuta transport K50.' },
];

/** Free-text entry composer. `onSubmit(text)` must return a promise; rejections show inline. */
export default function EntryBox({ onSubmit, id = 'entry-text', autoFocus = false, language = 'English' }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is unavailable in this browser. Type your note instead.');
      return;
    }
    const recognizer = new Recognition();
    recognitionRef.current = recognizer;
    recognizer.lang = language === 'Nyanja' ? 'ny-ZM' : language === 'Bemba' ? 'bem-ZM' : 'en-ZA';
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results || []).map((result) => result[0]?.transcript || '').join(' ').trim();
      if (transcript) setText((previous) => `${previous.trim()}${previous.trim() ? ' ' : ''}${transcript}`);
      setError('');
    };
    recognizer.onerror = (event) => {
      if (event.error === 'language-not-supported') setError('This browser does not support speech recognition for this language yet. Type your note; local Bemba/Nyanja phrase parsing is available.');
      else if (event.error !== 'aborted' && event.error !== 'no-speech') setError('Voice input could not start. Check microphone permission or type your note.');
      setListening(false);
    };
    recognizer.onend = () => setListening(false);
    setError('');
    setListening(true);
    try { recognizer.start(); }
    catch { setListening(false); setError('Voice input could not start. Check microphone permission or type your note.'); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setError('Write what happened in your business first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await onSubmit(text);
      setPrepared(result || null);
      setText('');
    } catch (err) {
      setError(err.message || 'We could not process that entry. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">
        Tell us what happened in your business
      </label>
      <Textarea
        id={id}
        rows={4}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
          if (prepared) setPrepared(null);
        }}
        placeholder="For example: Sold goods for K250 and paid K40 for transport."
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        aria-invalid={error ? true : undefined}
        disabled={busy}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Try an example in a Zambian language">
        <span className="text-[11px] text-ink-muted">Try an example:</span>
        {LANGUAGE_EXAMPLES.map((example) => <button key={example.label} type="button" disabled={busy} onClick={() => { setText(example.text); setError(''); setPrepared(null); }} className="rounded border border-line px-2 py-1 text-[11px] font-semibold text-brand-700 hover:border-brand focus-ring disabled:opacity-50">{example.label}</button>)}
      </div>
      {error ? (
        <div id={`${id}-error`} className="mt-3">
          <Notification tone="danger">{error}</Notification>
        </div>
      ) : (
        <p id={`${id}-hint`} className="mt-2 text-[13px] text-ink-muted">
          Messy notes are fine. Include amounts in Kwacha, like K500.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleListening} disabled={busy} aria-pressed={listening} className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-line bg-[#121a1b] px-3 text-xs font-bold text-ink-muted hover:border-brand hover:text-ink disabled:opacity-50">
          {listening ? <MicOff className="h-4 w-4 text-accent-800" /> : <Mic className="h-4 w-4 text-brand-700" />}{listening ? 'Stop listening' : 'Speak entry'}
        </button>
        {listening && <span role="status" className="text-xs text-brand-700">Listening. Say the amount and what happened.</span>}
      </div>

      <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" icon={ArrowRight} loading={busy}>
        {busy ? 'Processing' : 'Process entry'}
      </Button>
      {prepared && <section aria-live="polite" className="mt-4 rounded-lg border border-brand-200 bg-[#0e1516] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">AI DRAFT · DETERMINISTIC ZRA MATH</p><h3 className="mt-1 text-sm font-extrabold">{prepared.transactions?.length ? `${prepared.transactions.length} draft${prepared.transactions.length === 1 ? '' : 's'} prepared for review` : 'Business check recorded'}</h3></div><Link to="/app/transactions" className="text-xs font-bold text-brand-700 underline">Open review queue</Link></div>
        {prepared.transactions?.length > 0 && <ul className="mt-3 space-y-2">{prepared.transactions.map((transaction) => <li key={transaction.id} className="rounded-md border border-line bg-[#121a1b] px-3 py-2.5"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold">{transaction.type === 'owner_withdrawal' ? 'Owner withdrawal' : transaction.type === 'income' ? 'Sale' : 'Expense'} · {transaction.category}</p><p className="mt-0.5 text-xs text-ink-muted">{transaction.description}</p></div><p className="text-sm font-extrabold tabular-nums">{formatKwacha(transaction.amount)}</p></div>{transaction.aiExplanation && <details className="mt-2 border-t border-line pt-2"><summary className="cursor-pointer text-[10px] font-bold text-brand-700">Why AI flagged this</summary><p className="mt-1 text-[11px] leading-5 text-ink-muted">{transaction.aiExplanation}</p></details>}</li>)}</ul>}
        {prepared.operations?.map((operation, index) => <p key={`${operation.type}-${index}`} className="mt-2 text-xs text-ink-muted">Cash count K{Number(operation.actual).toLocaleString('en-ZM')} recorded for till review. It is not sales or income.</p>)}
        {prepared.parsing?.unparsed?.length > 0 && <p className="mt-2 text-[11px] leading-5 text-accent">I left {prepared.parsing.unparsed.length} part(s) out of the ledger because they need a clearer amount or description.</p>}
        <p className="mt-3 border-t border-line pt-2 text-[10px] leading-5 text-ink-muted">These entries stay pending until you review and confirm them. AI can prepare drafts; it cannot change confirmed profit or tax totals.</p>
      </section>}
      <p className="mt-3 text-xs leading-5 text-ink-muted">Voice recognition comes from your browser. The local parser recognizes a small synthetic English, Zanglish, Bemba and Nyanja phrase set; it is not yet validated with real trader speech. Check every draft before confirming.</p>
    </form>
  );
}
