import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { LoadingState } from './components/common/States';

// Heavy pages (charts) load on demand to keep the first paint light.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const TaxPage = lazy(() => import('./pages/TaxPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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

function RequireTeamAccess({ children }) {
  const { user, status, isTeamMember, profileComplete } = useAuth();
  const location = useLocation();
  if (status === 'loading' || status === 'checking') return <main className="min-h-screen bg-[#0b1112] px-4 pt-16"><LoadingState label="Securing your workspace" /></main>;
  if (!user || status === 'signed_out' || status === 'unconfigured') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (status === 'denied' || status === 'error' || !isTeamMember) return <Navigate to="/login?denied=1" replace />;
  if (!profileComplete && location.pathname !== '/app/profile') return <Navigate to="/app/profile" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <AuthLinkRedirect />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/workspace" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app" element={<RequireTeamAccess><AppShell /></RequireTeamAccess>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="agent" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="profile" element={<BusinessProfilePage />} />
          <Route path="tax" element={<TaxPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

