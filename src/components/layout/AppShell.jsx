import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import ErrorBoundary from '../common/ErrorBoundary';
import { LoadingState } from '../common/States';
import AddEntryModal from '../transactions/AddEntryModal';

export default function AppShell() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar onAddEntry={() => setAddOpen(true)} />
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
    </div>
  );
}

