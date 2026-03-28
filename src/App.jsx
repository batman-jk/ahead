import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import { UiProvider } from './context/UiProvider';
import Navigation from './components/Navigation';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Onboarding from './pages/Onboarding';
import Roadmap from './pages/Roadmap';

const FullPageLoader = () => (
  <div className="page-loader">
    <div className="loading-spinner"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading || (user && profile === undefined)) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />;

  return children;
};

const OnboardingRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading || (user && profile === undefined)) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarded) return <Navigate to="/" replace />;

  return children;
};

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const showNav = !loading && user && profile?.onboarded;

  return (
    <BrowserRouter>
      {showNav && <Navigation />}
      <div className="main-content">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <UiProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </UiProvider>
  );
}

export default App;
