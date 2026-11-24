import { Link } from 'react-router-dom';

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#185C58" stroke="#2D807A" strokeWidth="1.25" />
      <path d="M10.5 12.5h19L10.5 27.5h19" fill="none" stroke="#F4F6F4" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="#E0A84B" stroke="#185C58" strokeWidth="1.5" />
    </svg>
  );
}

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} aria-label="ZedBiz Lens home" className={`inline-flex items-center gap-2.5 rounded-md focus-ring ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-extrabold tracking-tight text-ink">
        ZedBiz <span className="font-semibold text-brand-700">Lens</span>
      </span>
    </Link>
  );
}
