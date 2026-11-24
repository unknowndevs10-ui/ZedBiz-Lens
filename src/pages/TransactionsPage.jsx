import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox, Plus, Search } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { Input } from '../components/common/FormControls';
import EntryReviewGroup from '../components/transactions/EntryReviewGroup';
import TransactionTable from '../components/transactions/TransactionTable';
import EditTransactionModal from '../components/transactions/EditTransactionModal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 15;
const TABS = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const sortTransactions = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));

export default function TransactionsPage() {
  const { openAddEntry } = useOutletContext();
  const { transactions, status, error, reload, business, isSyntheticDemo, confirmTransaction, rejectTransaction, updateTransaction, confirmMany, rejectMany } = useData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('confirmed');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const c = { all: transactions.length, confirmed: 0, pending: 0, rejected: 0 };
    transactions.forEach((t) => (c[t.status] += 1));
    return c;
  }, [transactions]);

  const pendingGroups = useMemo(() => {
    const groups = new Map();
    transactions.filter((t) => t.status === 'pending').forEach((t) => {
      const key = t.entryId || t.id;
      if (!groups.has(key)) groups.set(key, { key, source: t.source, items: [], createdAt: t.createdAt || '' });
      groups.get(key).items.push(t);
    });
    return [...groups.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [transactions]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortTransactions(transactions).filter((t) => (tab === 'all' || t.status === tab) && (!needle || `${t.description} ${t.category}`.toLowerCase().includes(needle)));
  }, [transactions, tab, query]);

  async function attempt(action, success) {
    try {
      await action();
      if (success) toast(success);
    } catch (err) {
      toast(err.message || 'That did not work. Try again.', { tone: 'danger', title: 'Action failed' });
    }
  }

  const handleConfirm = (tx) => attempt(() => confirmTransaction(tx.id), 'Confirmed. Your dashboard is updated.');
  const handleReject = (tx) => attempt(() => rejectTransaction(tx.id), 'Entry rejected. It will not count in your numbers.');
  const handleConfirmAll = (ids) => attempt(() => confirmMany(ids), `${ids.length} entries confirmed. Your dashboard is updated.`);
  const handleRejectAll = (ids) => attempt(() => rejectMany(ids), `${ids.length} entries rejected.`);

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-ink-muted">{business ? `${business.name} · ` : ''}Review new entries, then manage your ledger.</p>
        </div>
        {!isSyntheticDemo && <Button icon={Plus} onClick={openAddEntry} className="hidden sm:inline-flex">Add entry</Button>}
      </header>

      {status === 'loading' && !transactions.length ? (
        <LoadingState label="Loading transactions" />
      ) : status === 'error' ? (
        <Card className="mt-6"><ErrorState title="We could not load your transactions" description={error?.message} onRetry={reload} /></Card>
      ) : (
        <>
          <section className="mt-6" aria-labelledby="review-heading">
            <h2 id="review-heading" className="mb-3 flex items-center gap-2 text-[15px] font-bold">
              Needs your review
              {counts.pending > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold">{counts.pending}</span>}
            </h2>
            {pendingGroups.length === 0 ? (
              <Card>
                <EmptyState icon={Inbox} title="Nothing waiting for review" description={isSyntheticDemo ? 'Sample records are confirmed and read only.' : 'New entries appear here so you can confirm, edit or reject each line before it counts.'} action={!isSyntheticDemo && <Button icon={Plus} onClick={openAddEntry}>Add an entry</Button>} />
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingGroups.map((g) => (
                  <EntryReviewGroup key={g.key} source={g.source} items={g.items} onConfirm={handleConfirm} onReject={handleReject} onEdit={setEditing} onConfirmAll={handleConfirmAll} onRejectAll={handleRejectAll} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10" aria-labelledby="ledger-heading">
            <Card>
              <CardHeader title={<span id="ledger-heading">Ledger</span>} description={`${counts.confirmed} confirmed entries`} />
              <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-4 sm:px-5">
                <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-md border border-line bg-surface p-0.5">
                  {TABS.map((t) => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => { setTab(t.id); setLimit(PAGE_SIZE); }} className={`h-8 rounded px-2.5 text-[13px] font-semibold focus-ring ${tab === t.id ? 'bg-[#121a1b] text-brand-700 shadow-card' : 'text-ink-muted'}`}>
                      {t.label} <span className="text-ink-muted">{counts[t.id]}</span>
                    </button>
                  ))}
                </div>
                <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <Input type="search" aria-label="Search transactions" placeholder="Search description or category" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} className="h-10 pl-9" />
                </div>
              </div>
              {visible.length === 0 ? (
                <EmptyState icon={Search} title="No transactions match" description="Try another status or clear the search." action={<Button variant="secondary" onClick={() => { setTab('all'); setQuery(''); }}>Show all</Button>} />
              ) : (
                <>
                  <div className="border-t border-line"><TransactionTable transactions={visible.slice(0, limit)} onEdit={setEditing} readOnly={isSyntheticDemo} /></div>
                  {visible.length > limit && (
                    <div className="border-t border-line p-3 text-center">
                      <Button variant="ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)}>Show more ({visible.length - limit} left)</Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </section>
        </>
      )}

      <EditTransactionModal
        transaction={editing}
        onClose={() => setEditing(null)}
        onSave={async (patch) => {
          await updateTransaction(editing.id, patch);
          toast('Entry updated.');
        }}
      />
    </div>
  );
}
