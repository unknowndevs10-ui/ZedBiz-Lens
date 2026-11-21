import { ArrowRight, ClipboardCheck, Lightbulb, ReceiptText } from 'lucide-react';

export default function ExampleLedger() {
  const steps = [
    { icon: ReceiptText, number: '01', title: 'Capture the real day', body: 'Type or speak a sale or expense. ZedBiz organizes the note into a draft and keeps your original words for context.' },
    { icon: ClipboardCheck, number: '02', title: 'Review before it counts', body: 'Check the amount, category and date. Confirmation updates the ledger, profit view and tax-readiness signals.' },
    { icon: Lightbulb, number: '03', title: 'Get a useful next step', body: 'The business brain looks for missing records and changing patterns, then explains what it noticed and what you can review.' },
  ];
  return (
    <section id="workflow" className="scroll-mt-28 border-b border-line bg-[#101718]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-2xl"><p className="eyebrow">One connected workflow</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">From the way you trade to the next useful step.</h2><p className="mt-4 leading-7 text-ink-muted">The experience begins by understanding the business. Then every confirmed sale or cost helps the dashboard, calculator and business guidance stay in sync.</p><div className="mt-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-700">Synthetic scenarios we use to exercise the demo</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full border border-line bg-[#0d1415] px-3 py-1.5 text-xs font-semibold text-ink-muted">Informal tomato trader</span><span className="rounded-full border border-line bg-[#0d1415] px-3 py-1.5 text-xs font-semibold text-ink-muted">Formal small shop</span><span className="rounded-full border border-line bg-[#0d1415] px-3 py-1.5 text-xs font-semibold text-ink-muted">Profitable private-sector SME</span></div><p className="mt-2 text-[11px] leading-5 text-ink-muted">All example records are invented and kept separate from a signed-in business ledger.</p></div></div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, body }) => <article key={number} className="rounded-2xl border border-line bg-[#0d1415] p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-xs font-extrabold tracking-[.16em] text-accent">{number}</span><Icon className="h-5 w-5 text-brand-700" /></div><h3 className="mt-7 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p><div className="mt-5 h-px bg-line" /><p className="mt-3 text-[11px] font-semibold text-ink-muted">A person stays in control at every decision.</p></article>)}
        </div>
      </div>
    </section>
  );
}

