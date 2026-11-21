import { NavLink, Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Plus } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../common/Button';
import { NAV_ITEMS } from './navItems';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ onAddEntry }) {
  const { pendingCount, isSyntheticDemo } = useData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-[#121a1b] px-4 py-5 lg:flex">
      <Logo to="/app/dashboard" className="px-1" />
      <div className="mt-6 rounded-xl border border-line bg-[#151e1f] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink-muted">Your workspace</p>
        <p className="mt-1 truncate text-sm font-bold text-ink">One business. Clearer books.</p>
      </div>
      {!isSyntheticDemo && <Button className="mt-4 w-full" icon={Plus} onClick={onAddEntry}>Add entry</Button>}

      <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors focus-ring ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface hover:text-ink'}`
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {badge && pendingCount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink" aria-label={`${pendingCount} awaiting review`}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link to="/" className="flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-semibold text-ink-muted hover:bg-surface hover:text-ink focus-ring">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home page
        </Link>
        <button type="button" onClick={async () => { try { await signOut(); navigate('/login', { replace: true }); } catch { /* the session provider will remain available for retry */ } }} className="flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-semibold text-ink-muted hover:bg-surface hover:text-ink focus-ring">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </aside>
  );
}

