import Logo from '../common/Logo';
import BusinessSwitcher from './BusinessSwitcher';

/** Phones and tablets: logo plus business switcher. Navigation lives in MobileNav. */
export default function Topbar() {
  return (
    <header className="sticky top-8 z-30 flex items-center justify-between gap-3 border-b border-line bg-[#121a1b] px-4 py-2.5 lg:hidden">
      <Logo to="/app/dashboard" />
      <div className="w-24 sm:w-44">
        <BusinessSwitcher compact />
      </div>
    </header>
  );
}
