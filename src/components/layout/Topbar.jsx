import Logo from '../common/Logo';
import BusinessSwitcher from './BusinessSwitcher';
import { LogOut } from 'lucide-react';
import { useDemoSession } from '../../context/DemoSessionContext';

/** Phones and tablets: logo plus business switcher. Navigation lives in MobileNav. */
export default function Topbar() {
  const { endDemoSession } = useDemoSession();
  return (
    <header className="sticky top-8 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5 lg:hidden">
      <Logo to="/app/dashboard" />
      <div className="w-24 sm:w-44">
        <BusinessSwitcher compact />
      </div>
      <button type="button" onClick={endDemoSession} aria-label="End demo session" title="End demo session" className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink">
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  );
}
