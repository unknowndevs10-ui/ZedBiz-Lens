import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useData } from '../../context/DataContext';

function Tab({ item, pendingCount }) {
  const { to, label, mobileLabel, icon: Icon, badge } = item;
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold focus-ring ${isActive ? 'text-brand-700' : 'text-ink-muted'}`}
    >
      <span className="relative">
        <Icon className="h-5 w-5" aria-hidden="true" />
        {badge && pendingCount > 0 && (
          <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-ink">{pendingCount}</span>
        )}
      </span>
      {mobileLabel || label.split(' ')[0]}
    </NavLink>
  );
}

export default function MobileNav({ onAddEntry }) {
  const { pendingCount } = useData();
  const [dashboard, transactions, profile, tax, reports] = NAV_ITEMS;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#121a1b] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid h-16 grid-cols-6">
        <Tab item={dashboard} pendingCount={pendingCount} />
        <Tab item={transactions} pendingCount={pendingCount} />
        <Tab item={profile} pendingCount={pendingCount} />
        <div className="flex items-center justify-center">
          <button type="button" onClick={onAddEntry} aria-label="Add entry" className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-pop focus-ring">
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <Tab item={tax} pendingCount={pendingCount} />
        <Tab item={reports} pendingCount={pendingCount} />
      </div>
    </nav>
  );
}

