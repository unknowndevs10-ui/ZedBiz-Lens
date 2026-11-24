import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import LoadingScene from './components/common/LoadingScene';
import { useData } from './context/DataContext';
import DemoLaunch from './pages/DemoLaunch';
import Logo from './components/common/Logo';

// Heavy pages (charts) load on demand to keep the first paint light.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const TaxPage = lazy(() => import('./pages/TaxPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const BoundariesPage = lazy(() => import('./pages/BoundariesPage'));
const CapturePage = lazy(() => import('./pages/CapturePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AuthLinkRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const authType = new URLSearchParams(location.hash.replace(/^#/, '')).get('type');
    if (['invite', 'recovery'].includes(authType) && location.pathname !== '/login') {
      navigate(`/login${location.search}${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);
  return null;
}

function RequireAccountAccess({ children }) {
  const { user, status, profileComplete } = useAuth();
  const { isSyntheticDemo } = useData();
  const location = useLocation();
  if (status === 'loading' || status === 'checking') return <LoadingScene label="Securing your workspace" />;
  if (isSyntheticDemo) return children;
  if (!user || status === 'signed_out' || status === 'unconfigured') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (status === 'error') return <Navigate to="/login?error=profile" replace />;
  if (!profileComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function RequireOnboardingAccess({ children }) {
  const { user, status, profileComplete } = useAuth();
  if (status === 'loading' || status === 'checking') return <LoadingScene label="Preparing your private setup" />;
  if (!user || status === 'signed_out' || status === 'unconfigured') return <Navigate to="/login?mode=signup" replace />;
  if (status === 'error') return <Navigate to="/login?error=profile" replace />;
  if (profileComplete) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function OnboardingShell() {
  return <div className="min-h-screen bg-surface"><header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-8"><Logo to="/" /><span className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-800 sm:inline-flex">Private business setup · progress saves as you continue</span><span className="text-[10px] font-semibold text-ink-muted sm:hidden">Private setup</span></header><BusinessProfilePage /></div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <AuthLinkRedirect />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/boundaries" element={<BoundariesPage />} />
        <Route path="/scope" element={<BoundariesPage />} />
        <Route path="/demo/:scenario" element={<DemoLaunch />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<RequireOnboardingAccess><OnboardingShell /></RequireOnboardingAccess>} />
        <Route path="/workspace" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app" element={<RequireAccountAccess><AppShell /></RequireAccountAccess>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="capture" element={<CapturePage />} />
          <Route path="agent" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="profile" element={<BusinessProfilePage />} />
          <Route path="tax" element={<TaxPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
