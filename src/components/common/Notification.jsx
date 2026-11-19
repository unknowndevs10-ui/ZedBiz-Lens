import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

const TONES = {
  info: { box: 'border-brand-200 bg-brand-50', icon: Info, iconClass: 'text-brand-700' },
  success: { box: 'border-success/30 bg-white', icon: CheckCircle2, iconClass: 'text-success' },
  warning: { box: 'border-accent-100 bg-accent-50', icon: AlertTriangle, iconClass: 'text-accent-800' },
  danger: { box: 'border-danger/30 bg-white', icon: XCircle, iconClass: 'text-danger' },
};

export default function Notification({ tone = 'info', title, children, onDismiss, className = '' }) {
  const { box, icon: Icon, iconClass } = TONES[tone] || TONES.info;
  return (
    <div role={tone === 'danger' ? 'alert' : undefined} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${box} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm text-ink">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-ink-muted' : ''}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-mr-1 rounded p-1 text-ink-muted hover:bg-black/5 focus-ring">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
