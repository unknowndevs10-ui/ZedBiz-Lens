import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import Notification from '../common/Notification';
import { Textarea } from '../common/FormControls';

const EXAMPLES = [
  { label: 'Retail shop', text: 'Bought stock for K500, sold goods worth K1200 and paid K100 for transport.' },
  { label: 'Hair salon', text: 'Braided hair for a client K250, another client K180, bought hair products K300.' },
  { label: 'Market trader', text: 'Sold tomatoes K850 at the market, paid market levy K40, bus fare K60 yesterday.' },
];

/** Free-text entry composer. `onSubmit(text)` must return a promise; rejections show inline. */
export default function EntryBox({ onSubmit, id = 'entry-text', autoFocus = false }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setError('Write what happened in your business first, or try one of the examples.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(text);
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
        }}
        placeholder="Bought stock for K500, sold goods worth K1200 and paid K100 for transport."
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        aria-invalid={error ? true : undefined}
        disabled={busy}
      />
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
        <span className="text-[13px] text-ink-muted">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={busy}
            onClick={() => {
              setText(ex.text);
              setError('');
            }}
            className="rounded-md border border-line bg-[#121a1b] px-2.5 py-1 text-[13px] font-semibold text-brand-700 hover:bg-brand-50 focus-ring disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" icon={ArrowRight} loading={busy}>
        {busy ? 'Processing' : 'Process entry'}
      </Button>
      <p className="mt-3 text-xs text-ink-muted">Demo: entries are read by a simple rule-based simulation, not an AI model. You review everything before it counts.</p>
    </form>
  );
}
