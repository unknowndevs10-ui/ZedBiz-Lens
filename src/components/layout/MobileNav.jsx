import { NavLink } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useData } from '../../context/DataContext';

export default function MobileNav() {
  const { pendingCount } = useData();
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(24,48,42,0.06)] backdrop-blur lg:hidden">
    <div className="grid h-[4.25rem] grid-cols-5">
      {NAV_ITEMS.map(({to,label,icon:Icon,badge})=><NavLink key={to} to={to} className={({isActive})=>`relative flex min-h-11 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${isActive?'text-brand-700':'text-ink-muted'}`}><span className="relative"><Icon className="h-5 w-5" />{badge&&pendingCount>0&&<span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[9px] leading-4 text-ink">{pendingCount}</span>}</span>{label}</NavLink>)}
      <NavLink to="/app/profile" className={({isActive})=>`relative flex min-h-11 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${isActive?'text-brand-700':'text-ink-muted'}`}><Settings2 className="h-5 w-5" />Business</NavLink>
    </div>
  </nav>;
}
