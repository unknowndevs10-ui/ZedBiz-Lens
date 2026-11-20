import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff } from 'lucide-react';
import Button from '../common/Button';
import Notification from '../common/Notification';
import { Textarea } from '../common/FormControls';

/** Free-text entry composer. `onSubmit(text)` must return a promise; rejections show inline. */
export default function EntryBox({ onSubmit, id = 'entry-text', autoFocus = false, language = 'English' }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
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
    recognizer.lang = language === 'Nyanja' || language === 'Bemba' ? 'en-ZM' : 'en-ZA';
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results || []).map((result) => result[0]?.transcript || '').join(' ').trim();
      if (transcript) setText((previous) => `${previous.trim()}${previous.trim() ? ' ' : ''}${transcript}`);
      setError('');
    };
    recognizer.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') setError('Voice input could not start. Check microphone permission or type your note.');
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
        placeholder="For example: Sold goods for K250 and paid K40 for transport."
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
        <button type="button" onClick={toggleListening} disabled={busy} aria-pressed={listening} className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-line bg-[#121a1b] px-3 text-xs font-bold text-ink-muted hover:border-brand hover:text-ink disabled:opacity-50">
          {listening ? <MicOff className="h-4 w-4 text-accent-800" /> : <Mic className="h-4 w-4 text-brand-700" />}{listening ? 'Stop listening' : 'Speak entry'}
        </button>
        {listening && <span role="status" className="text-xs text-brand-700">Listening. Say the amount and what happened.</span>}
      </div>

      <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" icon={ArrowRight} loading={busy}>
        {busy ? 'Processing' : 'Process entry'}
      </Button>
      <p className="mt-3 text-xs leading-5 text-ink-muted">This pilot prepares a draft from your note for you to check. Voice recognition is provided by your browser; English is the validated input language, and Bemba/Nyanja recognition still needs native-speaker testing. Use typing if recognition is unclear.</p>
    </form>
  );
}

