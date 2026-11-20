import { Suspense, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import DemoBanner from './DemoBanner';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ErrorBoundary from '../common/ErrorBoundary';
import { LoadingState } from '../common/States';
import AddEntryModal from '../transactions/AddEntryModal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useDemoSession } from '../../context/DemoSessionContext';

export default function AppShell() {
  const { active } = useDemoSession();
  const location = useLocation();
  const { resetDemoData } = useData();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!active) return <Navigate to="/workspace" state={{ from: location }} replace />;

  async function confirmReset() {
    setResetting(true);
    try {
      await resetDemoData();
      toast('Demo data restored to its starting point.');
      setResetOpen(false);
    } catch (err) {
      toast(err.message || 'Could not reset the demo data.', { tone: 'danger' });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <DemoBanner />
      <Topbar />
      <div className="flex">
        <Sidebar onAddEntry={() => setAddOpen(true)} onReset={() => setResetOpen(true)} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-6xl">
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
      <Modal
        open={resetOpen}
        onClose={() => !resetting && setResetOpen(false)}
        title="Reset demo data?"
        description="This removes your entries and edits and restores the original synthetic data for all three demo businesses."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</Button>
            <Button variant="danger" onClick={confirmReset} loading={resetting}>Reset demo data</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">Nothing outside this browser is affected.</p>
      </Modal>
    </div>
  );
}
