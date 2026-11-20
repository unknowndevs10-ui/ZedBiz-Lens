import Logo from '../common/Logo';
import BusinessSwitcher from './BusinessSwitcher';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

/** Phones and tablets: logo plus business switcher. Navigation lives in MobileNav. */
export default function Topbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-8 z-30 flex items-center justify-between gap-3 border-b border-line bg-[#121a1b] px-4 py-2.5 lg:hidden">
      <Logo to="/app/dashboard" />
      <div className="w-24 sm:w-44">
        <BusinessSwitcher compact />
      </div>
      <Button variant="ghost" size="sm" aria-label="Sign out" title="Sign out" onClick={async () => { try { await signOut(); navigate('/login', { replace: true }); } catch { /* allow a later retry if offline */ } }} icon={LogOut} />
    </header>
  );
}

