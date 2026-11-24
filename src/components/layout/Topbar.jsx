import Logo from '../common/Logo';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useData } from '../../context/DataContext';

/** Phones and tablets: compact brand header. Navigation lives in MobileNav. */
export default function Topbar() {
  const { signOut, businessProfile } = useAuth();
  const { business, isSyntheticDemo } = useData();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="min-w-0"><Logo to="/app/dashboard" /><p className="mt-0.5 truncate pl-9 text-[10px] text-ink-muted">{business?.name || 'My business'} · {businessProfile?.role || 'Owner'} · {isSyntheticDemo ? 'Sample' : 'Live ledger'}</p></div>
      <Button variant="ghost" size="sm" aria-label="Sign out" title="Sign out" onClick={async () => { try { await signOut(); navigate('/login', { replace: true }); } catch { /* allow a later retry if offline */ } }} icon={LogOut} />
    </header>
  );
}
