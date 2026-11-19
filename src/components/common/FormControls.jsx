import { useId } from 'react';

/** Label + control + hint/error. Pass a render function so the control gets the generated id. */
export function Field({ label, hint, error, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`field h-11 ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`field py-3 leading-relaxed ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`field h-11 pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}
