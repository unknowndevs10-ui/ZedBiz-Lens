import { ArrowRight, ArrowUpRight, Camera, Check, CircleDot, Database, Landmark, Mic2, Network, Radio, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const previewRecords = [
  { icon: ArrowUpRight, label: 'Tomatoes · sale', amount: '+ K600', color: 'text-success' },
  { icon: ReceiptText, label: 'Stock · wholesale', amount: '− K400', color: 'text-ink' },
  { icon: CircleDot, label: 'Transport · expense', amount: '− K50', color: 'text-ink' },
];

const systemLayers = [
  { number: '01', title: 'Access & capture', text: 'Voice, text, receipts and mobile-money messages. Offline drafts wait safely for a connection.', icon: Camera },
  { number: '02', title: 'Business record', text: 'Sales connect to stock, costs, suppliers, customer credit and cash checks with source detail.', icon: Database },
  { number: '03', title: 'AI interpretation', text: 'Local language and intent rules prepare drafts and explain patterns. The owner approves every change.', icon: Sparkles },
  { number: '04', title: 'Finance & ZRA readiness', text: 'A deterministic rules engine calculates management totals and illustrative tax scenarios.', icon: Landmark },
  { number: '05', title: 'Connectivity ecosystem', text: 'Designed for wider access. Zamtel SMS/USSD and ZRA services remain proposed until authorized and connected.', icon: Radio },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <>
      <section className="landing-hero relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 sm:px-7 sm:py-12 lg:min-h-[620px] lg:grid-cols-[.88fr_1.12fr] lg:gap-14 lg:px-10 lg:py-14">
          <div className="relative z-10 max-w-xl">
            <p className="eyebrow flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /> BUILT FOR THE WAY ZAMBIA DOES BUSINESS</p>
            <h1 className="mt-5 text-[2.7rem] font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-[4.4rem]">Run your business.<br /><span className="text-brand-600">See the whole picture.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">ZedBiz Lens connects the layers behind an organized business: everyday capture, linked records, AI interpretation, deterministic finance and tax readiness, and a future connectivity layer.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/login?mode=signup" size="lg" icon={ArrowRight}>Create your workspace</Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/demo/tomato')}>Explore a sample business</Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-muted">Sample records are clearly labelled and kept separate from your business ledger.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-xs font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-2"><Mic2 className="h-4 w-4 text-brand-600" /> Voice or text capture</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /> You confirm every record</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] lg:ml-auto">
            <div className="relative min-h-[390px] overflow-hidden rounded-[1.6rem] border border-line bg-[#e5ebe7] shadow-pop sm:min-h-[480px]">
              <img className="absolute inset-0 h-full w-full object-cover object-center" src="https://images.pexels.com/photos/28112436/pexels-photo-28112436.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Market trader serving customers at an outdoor produce stall" fetchPriority="high" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#172b27]/15 via-transparent to-[#172b27]/10" aria-hidden="true" />
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-brand-800 shadow-card backdrop-blur sm:left-6 sm:top-6">Zambia · everyday enterprise</div>
              <div className="absolute inset-x-3 bottom-3 z-10 max-w-[390px] rounded-2xl border border-white/80 bg-white/95 p-4 shadow-pop backdrop-blur sm:inset-x-auto sm:bottom-7 sm:left-7 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-brand-700">A day, made clearer</p><p className="mt-1 text-sm font-extrabold">Market trader · sample preview</p></div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Sparkles className="h-4 w-4" /></span>
                </div>
                <div className="mt-3 space-y-2">{previewRecords.map(({ icon: Icon, label, amount, color }) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"><span className="flex items-center gap-2 text-xs font-semibold text-ink-muted"><Icon className="h-3.5 w-3.5 text-brand-600" />{label}</span><span className={`text-xs font-extrabold tabular-nums ${color}`}>{amount}</span></div>)}</div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="text-[11px] font-semibold text-ink-muted">Drafts for your review</span><span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700"><Check className="h-3 w-3" /> Owner approval</span></div>
              </div>
              <div className="absolute right-4 top-16 z-10 hidden rounded-xl border border-white/80 bg-white/95 p-3 shadow-card backdrop-blur sm:block lg:right-6 lg:top-20"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-50 text-accent-800"><Camera className="h-4 w-4" /></span><div><p className="text-[10px] font-bold text-ink-muted">INPUTS</p><p className="text-xs font-extrabold">Voice · text · receipt</p></div></div></div>
              <span className="absolute bottom-2 right-3 z-10 rounded-full bg-black/50 px-2 py-1 text-[8px] font-semibold text-white/90 backdrop-blur">Photo: Kayode Adedeji · Pexels</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] font-semibold text-ink-muted"><span>Capture <span className="px-1 text-brand-500">›</span> Review <span className="px-1 text-brand-500">›</span> Confirm <span className="px-1 text-brand-500">›</span> Understand</span><Link to="/how-it-works" className="inline-flex items-center gap-1 text-brand-700 hover:underline">See how it works <ArrowRight className="h-3 w-3" /></Link></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 sm:py-14 lg:px-10" aria-label="ZedBiz Lens system layers">
        <div className="max-w-2xl"><p className="eyebrow">THE SYSTEM UNDER THE WORKSPACE</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em] sm:text-3xl">Five connected layers. One clearer business picture.</h2><p className="mt-2 text-sm leading-6 text-ink-muted">The interface is only the access point. Each layer prepares trusted context for the next, while the owner stays in control.</p></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{systemLayers.map(({ number, title, text, icon: Icon }) => <article key={number} className="relative rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold tracking-[.18em] text-brand-600">LAYER {number}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span></div><h3 className="mt-4 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-ink-muted">{text}</p></article>)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs leading-5 text-ink-muted"><Network className="h-4 w-4 shrink-0 text-brand-700" /><span><strong className="text-ink">AI supports the workflow across layers.</strong> It interprets records and surfaces patterns; it never authorizes ledger changes or performs tax arithmetic.</span></div>
      </section>
    </>
  );
}
