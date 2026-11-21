import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const items = [
  ['AI scope', 'The pilot classifies a limited set of synthetic English requests, prepares reviewable drafts and summarizes confirmed records. It is not a general business expert and does not act without owner approval.'],
  ['Receipt and forecast models', 'The app exposes a Donut-compatible receipt extraction endpoint and a separate revenue forecast endpoint through one adapter. Without a configured service, receipt output is an explicitly labelled fixture and the outlook is a deterministic baseline; neither is represented as a live Donut or XGBoost result.'],
  ['Financial view', 'Gross profit uses recorded sales less stock costs. Net profit before tax subtracts recorded operating expenses. Break-even is shown only when fixed and variable cost inputs are available.'],
  ['Tax readiness', 'Tax screens show illustrative assumptions and threshold indicators. The prototype does not determine tax eligibility, select a tax treatment, calculate income-tax liability or VAT payable, or file returns. Confirm rules with Finance and current ZRA guidance.'],
  ['Data and integrations', 'Synthetic examples are separated from the user ledger. The current prototype ledger is browser-stored and is not a production accounting database. No live ZRA or Zamtel services are connected.'],
];

export default function BoundariesPage() {
  return <><Navbar /><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-5 py-12 sm:px-8 sm:py-20"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Home</Link><p className="eyebrow mt-10">Clear limits are part of the design</p><h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-.045em] sm:text-6xl">Useful guidance, without pretending to be official.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">ZedBiz Lens is a prototype for the Zamtel x ZRA innovation challenge. These boundaries describe what the current demo does and what still needs validation.</p><div className="mt-12 divide-y divide-line border-y border-line">{items.map(([title,text])=><section key={title} className="grid gap-3 py-6 sm:grid-cols-[12rem_1fr]"><h2 className="text-sm font-extrabold">{title}</h2><p className="max-w-2xl text-sm leading-6 text-ink-muted">{text}</p></section>)}</div><section className="mt-10"><h2 className="text-sm font-extrabold">Roadmap</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Validate tax rules with Finance and ZRA; assess Zamtel USSD/SMS connectivity; then evaluate Bemba and Nyanja capture with native speakers and suitable consented data.</p></section></main></>;
}
