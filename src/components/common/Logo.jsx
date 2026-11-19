import { Link } from 'react-router-dom';

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1F6F6B" />
      <circle cx="14.5" cy="14.5" r="6.5" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M19.5 19.5 25 25" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="14.5" cy="14.5" r="2.3" fill="#E0A84B" />
    </svg>
  );
}

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} aria-label="ZedBiz Lens home" className={`inline-flex items-center gap-2.5 rounded-md focus-ring ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-extrabold tracking-tight text-ink">
        ZedBiz <span className="font-semibold text-brand">Lens</span>
      </span>
    </Link>
  );
}
