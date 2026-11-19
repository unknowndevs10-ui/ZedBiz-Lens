const TONES = {
  neutral: 'bg-surface text-ink-muted border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  amber: 'bg-accent-50 text-accent-800 border-accent-100',
  success: 'bg-success/10 text-success border-success/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

export default function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
