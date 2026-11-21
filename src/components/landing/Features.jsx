import { AudioLines, BarChart3, FileText, Landmark, Receipt } from 'lucide-react';

const FEATURES = [
  { icon: Receipt, title: 'A ledger that starts with you', body: 'Begin with your own business profile and empty books. Add cash, mobile money and credit records as you trade.' },
  { icon: BarChart3, title: 'Numbers that move together', body: 'Confirm a record once and your sales, costs, gross profit, net profit and reports update from the same source.' },
  { icon: AudioLines, title: 'A business-aware brain', body: 'Transparent pilot rules use your business context and confirmed records to surface patterns for your review.' },
  { icon: Landmark, title: 'Tax readiness with clear limits', body: 'See turnover indicators and unresolved questions without presenting an estimate as a ZRA decision.' },
  { icon: FileText, title: 'Reports you can share', body: 'Create financial snapshots and tax-readiness reports from the same confirmed ledger.' },
];

export default function Features() {
  return (
    <section id="intelligence" className="scroll-mt-28 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="eyebrow">A calm operating system</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">Made to work together, not just look connected.</h2><p className="mt-4 text-sm leading-6 text-ink-muted">The business brain, ledger, summaries and tax-readiness view share one business context. An approved transaction refreshes the places that depend on it.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-xl border border-line bg-[#121a1b] p-4"><Icon className="h-5 w-5 text-brand-700" aria-hidden="true" /><h3 className="mt-3 text-sm font-extrabold">{title}</h3><p className="mt-1.5 text-xs leading-5 text-ink-muted">{body}</p></article>)}
          </div>
        </div>
      </div>
    </section>
  );
}

