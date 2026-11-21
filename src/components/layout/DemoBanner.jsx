import { FlaskConical } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div role="note" className="sticky top-0 z-50 flex h-8 items-center justify-center border-b border-accent-100 bg-accent-50 px-3 text-accent-800">
      <p className="flex items-center gap-1.5 truncate text-[11px] font-bold sm:text-xs">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        PROTOTYPE · Sample records are synthetic; your business profile and entries stay in this browser.
      </p>
    </div>
  );
}
