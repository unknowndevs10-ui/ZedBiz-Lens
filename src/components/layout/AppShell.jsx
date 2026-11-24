import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import ErrorBoundary from '../common/ErrorBoundary';
import { LoadingState } from '../common/States';
import AddEntryModal from '../transactions/AddEntryModal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import { ArrowLeftRight, Sparkles } from 'lucide-react';
import { readWorkspacePreferences } from '../../services/workspacePreferences';

export default function AppShell() {
  const [addOpen, setAddOpen] = useState(false);
  const [preferences, setPreferences] = useState(readWorkspacePreferences);
  const { isSyntheticDemo, exitSyntheticDemo } = useData();
  const { toast } = useToast();

  useEffect(() => {
    const syncPreferences = (event) => setPreferences(event.detail || readWorkspacePreferences());
    window.addEventListener('zedbiz:workspace-preferences', syncPreferences);
    return () => window.removeEventListener('zedbiz:workspace-preferences', syncPreferences);
  }, []);

  async function returnToLedger() {
    try {
      await exitSyntheticDemo();
      toast('Returned to your business ledger.');
    } catch (error) {
      toast(error.message || 'Could not return to your ledger.', { tone: 'danger' });
    }
  }

  return (
    <div className="app-shell min-h-screen bg-surface" data-theme={preferences.theme} data-density={preferences.density} data-motion={preferences.motion}>
      <Topbar />
      <div className="flex">
        <Sidebar onAddEntry={() => setAddOpen(true)} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {isSyntheticDemo && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-[#1b1913] px-4 py-3"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div><p className="text-xs font-extrabold text-ink">Synthetic sample workspace · read only</p><p className="mt-1 text-[11px] leading-5 text-ink-muted">These invented records are isolated from your business ledger and are not for tax filing.</p></div></div><Button variant="secondary" size="sm" icon={ArrowLeftRight} onClick={returnToLedger}>Return to my ledger</Button></div>}
            <ErrorBoundary>
              <Suspense fallback={<LoadingState label="Loading page" />}>
                <Outlet context={{ openAddEntry: () => setAddOpen(true) }} />
              </Suspense>
            </ErrorBoundary>
            <Footer compact />
          </div>
        </main>
      </div>
      <MobileNav onAddEntry={() => setAddOpen(true)} />
      <AddEntryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
