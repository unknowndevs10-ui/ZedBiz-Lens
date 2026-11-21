import { ArrowLeft, ArrowRight, Check, Mic2, UserRound, ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const stages = [
  { number: '01', title: 'Start with your business', text: 'Share your business type, how you trade, and what you want to understand. This creates a useful starting profile.', icon: UserRound },
  { number: '02', title: 'Capture sales and costs', text: 'Write or speak a short note, or upload a receipt. A configured Donut-compatible service can extract supplier, date, items, costs and confidence for review. Offline mode clearly uses a sample fixture, not image recognition.', icon: Mic2 },
  { number: '03', title: 'Review before it counts', text: 'Correct the amount, category or date, then confirm it. Unconfirmed drafts do not change your totals.', icon: Check },
  { number: '04', title: 'Understand the picture', text: 'Confirmed activity feeds business summaries, explainable pattern signals and a 30-day outlook. Offline forecasting uses a deterministic baseline; a configured model service can replace it later.', icon: ChartNoAxesCombined },
];

export default function HowItWorksPage() {
  return <><Navbar /><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-5 py-12 sm:px-8 sm:py-20"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Home</Link><p className="eyebrow mt-10">A simple business workflow</p><h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-.045em] sm:text-6xl">From the day’s trade to a clearer next step.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">ZedBiz brings business context, reviewed records and useful summaries into one steady flow. The owner stays in control at each step.</p><ol className="mt-12 divide-y divide-line border-y border-line">{stages.map(({number,title,text,icon:Icon})=><li key={number} className="grid gap-4 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-start"><span className="text-sm font-extrabold tabular-nums text-accent">{number}</span><div><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{text}</p></div><Icon className="hidden h-5 w-5 text-brand-700 sm:block" /></li>)}</ol><div className="mt-8 flex items-center gap-4 text-xs text-ink-muted"><span className="rounded-full border border-line px-3 py-1.5">Synthetic scenarios available</span><span>AI drafts require owner review</span></div><Link to="/login" className="mt-9 inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white hover:bg-[#195a57]">Enter your workspace <ArrowRight className="h-4 w-4" /></Link></main></>;
}
