import { ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

const ROWS = [
  { text: 'Bought stock', category: 'Stock purchases', amount: '-K500.00', income: false },
  { text: 'Sold goods', category: 'Sales', amount: '+K1,200.00', income: true },
  { text: 'Transport', category: 'Transport', amount: '-K100.00', income: false },
];

export default function ExampleLedger() {
  return (
    <section id="how-it-works" className="scroll-mt-28 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">From a quick note to a clear record</h2>
        <p className="mt-3 max-w-xl text-ink-muted">Write what happened. ZedBiz Lens separates it into lines, you check each one, and your dashboard updates.</p>

        <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-line bg-white p-5 shadow-card">
            <p className="text-[13px] font-bold text-ink-muted">What you write</p>
            <p className="mt-3 text-[15px] leading-relaxed">“Bought stock for K500, sold goods worth K1200 and paid K100 for transport.”</p>
          </div>
          <div className="hidden items-center justify-center lg:flex"><ArrowRight className="h-5 w-5 text-brand" aria-hidden="true" /></div>
          <div className="rounded-lg border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-[13px] font-bold text-ink-muted">What you review</p>
              <Badge tone="amber">Example</Badge>
            </div>
            <ul className="divide-y divide-line px-5">
              {ROWS.map((r) => (
                <li key={r.text} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold">{r.text}</p>
                    <p className="text-[13px] text-ink-muted">{r.category}</p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${r.income ? 'text-success' : 'text-ink'}`}>{r.amount}</p>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line bg-surface/60 px-5 py-3 text-sm">
              <span className="font-semibold text-ink-muted">Net for these entries</span>
              <span className="font-extrabold tabular-nums">K600.00</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
