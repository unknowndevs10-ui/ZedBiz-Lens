import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import Button from '../common/Button';

const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/scope', label: 'Compliance & AI scope' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} to={l.href} className="rounded-md px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink focus-ring">
              {l.label}
            </Link>
          ))}
          <Link to="/login" className="ml-3 rounded-md px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Sign in</Link>
          <Button to="/login?mode=signup" size="sm" className="ml-1">Create account</Button>
        </nav>
        <button type="button" className="rounded-md p-2 text-ink focus-ring md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Primary mobile" className="border-t border-line bg-white px-4 pb-4 pt-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-[15px] font-semibold text-ink hover:bg-surface">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2"><Button to="/login" variant="secondary">Sign in</Button><Button to="/login?mode=signup">Create account</Button></div>
        </nav>
      )}
    </header>
  );
}
