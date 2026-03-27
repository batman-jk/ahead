import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error_description');

    if (errorMsg) {
      setError(errorMsg.replace(/\+/g, ' '));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Supabase is not configured. Please check your .env file.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel animate-fade-in">
          <div className="loading-block">
            <div className="loading-spinner"></div>
            <p>Checking your session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={profile?.onboarded ? '/' : '/onboarding'} replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="brand-logo">
            <span className="brand-dot"></span>
            <h1>.ahead</h1>
          </div>
          <p>Know what to learn, track your consistency, see where you stand.</p>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            <strong>Auth Error:</strong> {error}
          </div>
        )}

        <div className="auth-action-area">
          <button
            onClick={handleGoogleLogin}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', gap: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" opacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" opacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" opacity="0.8" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Fast, secure, and passwordless authentication.
          </p>
        </div>

        <div className="auth-footer" style={{ marginTop: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
            <Sparkles size={16} />
            Elevate your learning journey
          </div>
          <button
            onClick={() => signOut()}
            className="btn-link"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Sign out of current session
          </button>
        </div>
      </div>
    </div>
  );
}
