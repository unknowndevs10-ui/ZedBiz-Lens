import { ArrowDownRight, ArrowRight, AudioLines, BookOpenCheck, CircleCheck, Landmark, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-[#0d1415]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-24">
        <div className="relative z-10">
          <p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Business clarity, built for Zambia</p>
          <h1 className="mt-5 max-w-2xl text-[2.7rem] font-extrabold leading-[1.05] tracking-[-.045em] sm:text-6xl lg:text-[4.25rem]">Every kwacha has a story. <span className="text-brand-700">See the whole picture.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">ZedBiz Lens helps small businesses turn everyday sales and costs into clear records, useful signals and tax readiness-without taking decisions away from the owner.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/login" size="lg" icon={ArrowRight}>Open your workspace</Button>
            <a href="#workflow" className="inline-flex h-12 items-center gap-2 rounded-md border border-line px-5 text-sm font-bold text-ink hover:border-brand-500 focus-ring">See the workflow <ArrowDownRight className="h-4 w-4" /></a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-ink-muted">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-700" /> You approve every entry</span>
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4 text-brand-700" /> Tax figures stay transparent</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-[#344344] bg-[#121a1b] p-5 shadow-pop sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
              <div><p className="text-xs font-bold uppercase tracking-[.15em] text-ink-muted">Business pulse</p><h2 className="mt-1 text-xl font-extrabold">A clearer day starts here.</h2></div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700"><Sparkles className="h-5 w-5" /></span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-5">
              <div className="rounded-xl border border-line bg-[#0d1415] p-4"><p className="text-xs font-semibold text-ink-muted">Capture</p><div className="mt-2 flex items-center gap-2 text-sm font-bold"><ScanLine className="h-4 w-4 text-brand-700" /> A sale, in your words</div></div>
              <div className="rounded-xl border border-line bg-[#0d1415] p-4"><p className="text-xs font-semibold text-ink-muted">Understand</p><div className="mt-2 flex items-center gap-2 text-sm font-bold"><AudioLines className="h-4 w-4 text-accent" /> Pattern, with context</div></div>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
              <div className="flex items-start gap-3"><span className="mt-0.5 text-brand-700"><BookOpenCheck className="h-5 w-5" /></span><div><p className="text-sm font-extrabold">The owner stays in control</p><p className="mt-1 text-sm leading-6 text-ink-muted">ZedBiz prepares a draft, explains its source and asks you to confirm before it updates your books.</p></div></div>
              <div className="mt-4 flex items-center gap-2 border-t border-brand-200 pt-3 text-xs font-semibold text-ink-muted"><CircleCheck className="h-4 w-4 text-success" /> Recorded � reviewed � ready to learn from</div>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-ink-muted">Illustrative product view. Tax estimates are educational and must be checked against current ZRA guidance.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

