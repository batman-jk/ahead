import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Check if we are in the middle of an OAuth redirect (code or access_token in URL)
  const isAuthRedirect = window.location.search.includes('code=') || 
                         window.location.hash.includes('access_token=');

  if (loading || isAuthRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;
  return children;
};


function AppRoutes() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {user && <Navigation />}
      <div className="main-content">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
