import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';

export function LoadingState({ label = 'Loading' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
      <p className="text-sm font-medium">{label}...</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-brand-100/70 ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-[15px] font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-[15px] font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
