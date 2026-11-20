import { Link } from 'react-router-dom';

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="13" fill="#123A38" stroke="#2C7771" strokeWidth="1.5" />
      <path d="M10 13.5h20M10 20h11M10 26.5h8" fill="none" stroke="#E9F3F1" strokeWidth="2.3" strokeLinecap="round" />
      <path d="m22 25 4.2 4.2L33 20" fill="none" stroke="#E0A84B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
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

