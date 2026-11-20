import { BarChart3, FileText, Landmark, Receipt } from 'lucide-react';

const FEATURES = [
  { icon: Receipt, title: 'Sales and expenses in one place', body: 'Every sale and cost sits in one ledger you can search, edit and trust.' },
  { icon: BarChart3, title: 'Know if you are making money', body: 'See sales, gross profit, net profit and margin for the last week, month or quarter.' },
  { icon: Landmark, title: 'Tax position at a glance', body: 'Track turnover against a threshold and compare regimes. Demo figures are illustrative.' },
  { icon: FileText, title: 'Reports you can share', body: 'Download a financial report or a tax position report as a PDF.' },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-28 border-b border-line bg-[#121a1b]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">What you get</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t-2 border-brand pt-4">
              <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
              <h3 className="mt-3 text-[15px] font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
