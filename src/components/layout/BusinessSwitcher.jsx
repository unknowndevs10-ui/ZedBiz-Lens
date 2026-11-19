import { Store } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function BusinessSwitcher({ compact = false }) {
  const { businesses, businessId, setBusinessId, business } = useData();
  if (!businesses.length) return null;
  return (
    <div>
      {!compact && <label htmlFor="business-switcher" className="mb-1.5 block text-xs font-semibold text-ink-muted">Demo business</label>}
      <div className="relative">
        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" aria-hidden="true" />
        <select
          id="business-switcher"
          aria-label="Demo business"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className={`field pl-9 pr-8 font-semibold ${compact ? 'h-10 text-sm' : 'h-11'}`}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      {!compact && business && <p className="mt-1.5 text-xs text-ink-muted">{business.kind} · {business.location}</p>}
    </div>
  );
}
