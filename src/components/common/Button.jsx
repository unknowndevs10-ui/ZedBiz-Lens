import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-card',
  secondary: 'bg-white text-ink border border-line hover:bg-brand-50 hover:border-brand-200 shadow-card',
  ghost: 'text-ink-muted hover:bg-brand-50 hover:text-ink',
  danger: 'bg-white text-danger border border-danger/30 hover:bg-danger/5',
  accent: 'bg-accent text-ink hover:bg-accent-400 shadow-card',
};
const SIZES = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

export default function Button({ variant = 'primary', size = 'md', icon: Icon, loading = false, to, className = '', children, disabled, type = 'button', ...rest }) {
  const classes = `inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
