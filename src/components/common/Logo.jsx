import { Link } from 'react-router-dom';

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#1F6F6B" />
      <circle cx="14" cy="14" r="8.25" fill="none" stroke="#fff" strokeWidth="1.8" opacity=".92" />
      <path d="M20 20 26 26" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9.5 16.5 12.5 13.5 15 15.2 18.7 10.7" fill="none" stroke="#E0A84B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18.7" cy="10.7" r="1.3" fill="#E0A84B" />
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
