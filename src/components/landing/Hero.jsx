import { useNavigate } from 'react-router-dom';
import { Calculator, ShieldCheck, Wallet } from 'lucide-react';
import Card from '../common/Card';
import EntryBox from '../transactions/EntryBox';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const POINTS = [
  { icon: Wallet, text: 'Kwacha first' },
  { icon: ShieldCheck, text: 'You confirm every entry' },
  { icon: Calculator, text: 'No spreadsheet skills needed' },
];

export default function Hero() {
  const { submitEntry } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(text) {
    const result = await submitEntry(text);
    const count = result.transactions.length;
    toast(`${count} ${count === 1 ? 'entry is' : 'entries are'} ready for your review.`);
    navigate('/app/transactions');
  }

  return (
    <section className="border-b border-line bg-[#121a1b]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-6">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">Your business. Your numbers. Your clarity.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
            Turn everyday business records into clear financial insights and better business decisions.
          </p>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-5 shadow-pop sm:p-6 lg:col-span-6">
          <EntryBox id="hero-entry-text" onSubmit={handleSubmit} />
        </Card>
      </div>
    </section>
  );
}
