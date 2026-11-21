import { ArrowRight, CircleHelp, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function AudienceSection() {
  return (
    <section id="trust" className="scroll-mt-28 border-b border-line bg-[#101718]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:py-20">
        <div><p className="eyebrow">Responsible by design</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight">Useful guidance, clear boundaries.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">ZedBiz helps organize records and highlight questions worth checking. It doesn't file returns, determine a legal tax position or replace ZRA and qualified finance advice. Each signal shows what it used and what still needs a person to confirm.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-ink-muted"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-700" /> Private account workspaces</span><span className="inline-flex items-center gap-2"><CircleHelp className="h-4 w-4 text-accent" /> Synthetic values are labeled</span></div></div>
        <Button to="/login" variant="secondary" icon={ArrowRight}>Team sign in</Button>
      </div>
    </section>
  );
}

