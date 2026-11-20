import { useNavigate } from 'react-router-dom';
import { ArrowRight, Scissors, ShoppingBasket, Store } from 'lucide-react';
import Button from '../common/Button';
import { useData } from '../../context/DataContext';

const ICONS = { retail: Store, salon: Scissors, market: ShoppingBasket };

export default function AudienceSection() {
  const { businesses, setBusinessId } = useData();
  const navigate = useNavigate();

  function openDemo(id) {
    setBusinessId(id);
    navigate('/app/dashboard');
  }

  return (
    <section id="built-for" className="scroll-mt-28">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">Built for the way small businesses really work</h2>
        <p className="mt-3 max-w-xl text-ink-muted">Open a demo business to explore the dashboard. All three use synthetic data.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {businesses.map((b) => {
            const Icon = ICONS[b.id] || Store;
            return (
              <div key={b.id} className="flex flex-col rounded-lg border border-line bg-[#121a1b] p-5 shadow-card">
                <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 text-[15px] font-bold">{b.kind}</h3>
                <p className="text-[13px] font-semibold text-ink-muted">{b.name} · {b.location}</p>
                <p className="mt-2 flex-1 text-sm text-ink-muted">{b.summary}</p>
                <Button variant="secondary" size="sm" icon={ArrowRight} className="mt-4 self-start" onClick={() => openDemo(b.id)}>Explore this demo</Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
