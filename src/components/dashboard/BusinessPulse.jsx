import { ArrowRight, AudioLines, CircleCheck, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TONES = {
  teal: 'border-brand-200 bg-brand-50',
  amber: 'border-accent-100 bg-accent-50',
  blue: 'border-[#284c55] bg-[#142326]',
};

export default function BusinessPulse({ signals, onSpeak, speaking }) {
  const [priority, ...supporting] = signals;
  return (
    <section aria-labelledby="business-pulse-title" className="mt-6 overflow-hidden rounded-2xl border border-line bg-[#121a1b]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700"><Sparkles className="h-5 w-5" /></span><div><p className="eyebrow">Business pulse</p><h2 id="business-pulse-title" className="mt-0.5 text-base font-extrabold">One thing to notice</h2></div></div>
        <button type="button" onClick={onSpeak} disabled={speaking || !signals.length} className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs font-bold text-ink-muted transition hover:border-brand-500 hover:text-ink disabled:opacity-50"><AudioLines className="h-4 w-4 text-brand-700" />{speaking ? 'Speaking.' : 'Listen to the short version'}</button>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {priority && <article className={`rounded-xl border p-4 sm:p-5 ${TONES[priority.tone] || TONES.teal}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-brand-700">{priority.id === 'first-record' ? <CircleCheck className="h-5 w-5" /> : <Info className="h-5 w-5" />}</span>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">Start here</p><h3 className="mt-1 text-sm font-extrabold leading-5">{priority.title}</h3><p className="mt-2 max-w-3xl text-xs leading-5 text-ink-muted">{priority.body}</p></div>
            </div>
            <Link to={priority.href} className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-[#111819] px-3 py-2 text-xs font-extrabold text-brand-700 hover:underline">{priority.action}<ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <p className="mt-3 border-t border-line/70 pt-3 text-[10px] font-semibold text-ink-muted">{priority.evidence}</p>
        </article>}
        {supporting.length > 0 && <details className="rounded-xl border border-line bg-[#0e1516]">
          <summary className="cursor-pointer px-4 py-3 text-xs font-extrabold text-ink-muted hover:text-ink">Show {supporting.length} more {supporting.length === 1 ? 'signal' : 'signals'}</summary>
          <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-2">{supporting.map((signal) => <article key={signal.id} className={`rounded-xl border p-4 ${TONES[signal.tone] || TONES.teal}`}>
          <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-extrabold leading-5">{signal.title}</h3><Info className="h-4 w-4 shrink-0 text-accent-800" /></div>
          <p className="mt-2 text-xs leading-5 text-ink-muted">{signal.body}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3"><span className="text-[10px] font-semibold text-ink-muted">{signal.evidence}</span><Link to={signal.href} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-brand-700 hover:underline focus-ring">{signal.action}<ArrowRight className="h-3 w-3" /></Link></div>
          </article>)}</div>
        </details>}
      </div>
      <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-ink-muted sm:px-5">These are explainable patterns from records you confirmed and the business context you chose. They are prompts for review, not decisions or tax advice.</p>
    </section>
  );
}

