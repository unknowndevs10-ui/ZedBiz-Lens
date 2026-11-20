import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, LockKeyhole, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';
import { useDemoSession } from '../context/DemoSessionContext';

export default function AccessPage() {
  const { active, beginDemoSession } = useDemoSession();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.from?.pathname?.startsWith('/app/') ? location.state.from.pathname : '/app/dashboard';

  useEffect(() => {
    if (active) navigate(destination, { replace: true });
  }, [active, destination, navigate]);

  function enter() {
    beginDemoSession();
    navigate(destination, { replace: true });
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Logo />
        <section className="mt-10 grid overflow-hidden rounded-3xl border border-line bg-white shadow-pop lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <p className="eyebrow">PUBLIC PROTOTYPE · NO ACCOUNT NEEDED</p>
            <h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Step into the demo workspace.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-muted">Explore the synthetic ledger, test the agent draft flow, and see the illustrative tax-readiness screens.</p>
            <Button className="mt-7" icon={ArrowRight} onClick={enter}>Open demo workspace</Button>
            <p className="mt-4 text-xs text-ink-muted">This creates a temporary, two-hour session in this browser tab.</p>
          </div>
          <div className="flex flex-col justify-center gap-5 bg-brand-50/60 px-6 py-8 sm:px-10">
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand"><FlaskConical className="h-4 w-4" /></span><div><p className="text-sm font-bold">Synthetic records only</p><p className="mt-1 text-xs leading-5 text-ink-muted">All businesses, transactions, and agent examples are fictional. Changes stay in this browser.</p></div></div>
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand"><ShieldCheck className="h-4 w-4" /></span><div><p className="text-sm font-bold">You approve every entry</p><p className="mt-1 text-xs leading-5 text-ink-muted">The agent can prepare a draft. It does not confirm records or make tax decisions.</p></div></div>
            <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand"><LockKeyhole className="h-4 w-4" /></span><div><p className="text-sm font-bold">Demo access, not account security</p><p className="mt-1 text-xs leading-5 text-ink-muted">This temporary browser session is a prototype convenience. It does not protect sensitive data or replace server-side authentication.</p></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
