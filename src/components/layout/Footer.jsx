import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

export default function Footer({ compact = false }) {
  if (compact) return <footer className="mt-12 border-t border-line pt-5 text-xs text-ink-muted"><p>ZedBiz Lens pilot. Your profile is linked to your account; transaction records currently stay in this browser. Tax indicators are illustrative.</p></footer>;
  return (
    <footer className="border-t border-line bg-[#121a1b]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5"><Logo /><p className="mt-3 max-w-sm text-sm text-ink-muted">A clearer way for small Zambian businesses to capture records, understand their numbers and prepare for compliance.</p></div>
        <nav aria-label="Footer" className="md:col-span-3"><h2 className="text-sm font-bold">Access</h2><ul className="mt-3 space-y-2 text-sm"><li><Link to="/login" className="rounded text-ink-muted hover:text-brand-700 focus-ring">Team sign in</Link></li></ul></nav>
        <div className="md:col-span-4"><h2 className="text-sm font-bold">Our boundaries</h2><p className="mt-3 text-sm text-ink-muted">A prototype for the Zamtel x ZRA innovation challenge. The business brain surfaces explainable patterns for review; people confirm every record and all tax decisions remain with the business and its qualified advisers.</p></div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-muted">© 2026 UnknownDevs · ZedBiz Lens</div>
    </footer>
  );
}
