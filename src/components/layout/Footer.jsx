import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const LINKS = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/transactions', label: 'Transactions' },
  { to: '/app/tax', label: 'Tax position' },
  { to: '/app/reports', label: 'Reports' },
];

export default function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="mt-12 border-t border-line pt-5 text-xs text-ink-muted">
        <p>ZedBiz Lens demo build. All data is synthetic. Tax figures are illustrative and pending Finance team approval.</p>
      </footer>
    );
  }
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-muted">Clear financial insight for small businesses and informal traders in Zambia.</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="text-sm font-bold">Explore the demo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-ink-muted hover:text-brand-700 focus-ring rounded">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="text-sm font-bold">About this build</h2>
          <p className="mt-3 text-sm text-ink-muted">
            Demo version for the Zamtel–ZRA 2026 Innovation Challenge. All business data is synthetic. Tax figures are illustrative placeholders pending Finance team approval and are not tax advice.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-muted">© 2026 ZedBiz Lens team</div>
    </footer>
  );
}
