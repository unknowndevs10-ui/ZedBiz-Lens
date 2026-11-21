import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useData } from '../../context/DataContext';

export default function MobileNav() {
  const { pendingCount } = useData();
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#101718]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
    <div className="grid h-16 grid-cols-4">
      {NAV_ITEMS.map(({to,label,icon:Icon,badge})=><NavLink key={to} to={to} className={({isActive})=>`relative flex min-h-11 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${isActive?'text-brand-700':'text-ink-muted'}`}><span className="relative"><Icon className="h-5 w-5" />{badge&&pendingCount>0&&<span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[9px] leading-4 text-ink">{pendingCount}</span>}</span>{label}</NavLink>)}
    </div>
  </nav>;
}
