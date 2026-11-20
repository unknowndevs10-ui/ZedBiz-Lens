import { ArrowRight, AudioLines, CircleCheck, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TONES = {
  teal: 'border-brand-200 bg-brand-50',
  amber: 'border-accent-100 bg-accent-50',
  blue: 'border-[#284c55] bg-[#142326]',
};

export default function BusinessPulse({ signals, onSpeak, speaking }) {
  return (
    <section aria-labelledby="business-pulse-title" className="mt-6 overflow-hidden rounded-2xl border border-line bg-[#121a1b]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700"><Sparkles className="h-5 w-5" /></span><div><p className="eyebrow">Your business brain</p><h2 id="business-pulse-title" className="mt-0.5 text-base font-extrabold">Signals worth your attention</h2></div></div>
        <button type="button" onClick={onSpeak} disabled={speaking || !signals.length} className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs font-bold text-ink-muted transition hover:border-brand-500 hover:text-ink disabled:opacity-50"><AudioLines className="h-4 w-4 text-brand-700" />{speaking ? 'Speaking.' : 'Listen to the short version'}</button>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {signals.map((signal) => <article key={signal.id} className={`flex min-h-48 flex-col rounded-xl border p-4 ${TONES[signal.tone] || TONES.teal}`}>
          <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-extrabold leading-5">{signal.title}</h3>{signal.id === 'first-record' ? <CircleCheck className="h-4 w-4 shrink-0 text-brand-700" /> : <Info className="h-4 w-4 shrink-0 text-accent-800" />}</div>
          <p className="mt-2 flex-1 text-xs leading-5 text-ink-muted">{signal.body}</p>
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-line/70 pt-3"><span className="text-[10px] font-semibold text-ink-muted">{signal.evidence}</span><Link to={signal.href} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-brand-700 hover:underline focus-ring">{signal.action}<ArrowRight className="h-3 w-3" /></Link></div>
        </article>)}
      </div>
      <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-ink-muted sm:px-5">These are explainable patterns from records you confirmed and the business context you chose. They are prompts for review, not decisions or tax advice.</p>
    </section>
  );
}

