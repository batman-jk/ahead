import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const authRequestRef = useRef(0);

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  const buildProfileSeed = useCallback((currentUser) => {
    const emailPrefix = currentUser.email?.split('@')[0] || 'student';
    const rawUsername =
      currentUser.user_metadata?.user_name ||
      currentUser.user_metadata?.username ||
      currentUser.user_metadata?.preferred_username ||
      emailPrefix;
    const normalizedUsername = rawUsername
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20);

    return {
      id: currentUser.id,
      username: `${normalizedUsername || 'student'}_${currentUser.id.slice(0, 6)}`,
      full_name: currentUser.user_metadata?.full_name || null,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };
  }, []);

  const ensureProfile = useCallback(async (currentUser) => {
    if (!supabase || !currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(buildProfileSeed(currentUser), { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Profile bootstrap error:', err);
      return null;
    }
  }, [buildProfileSeed]);

  const resolveProfile = useCallback(async (currentUser) => {
    if (!currentUser) return null;

    const existingProfile = await fetchProfile(currentUser.id);
    if (existingProfile) return existingProfile;

    const bootstrappedProfile = await ensureProfile(currentUser);
    if (bootstrappedProfile) return bootstrappedProfile;

    return fetchProfile(currentUser.id);
  }, [ensureProfile, fetchProfile]);

  const applySession = useCallback(async (session) => {
    const requestId = ++authRequestRef.current;
    const currentUser = session?.user ?? null;

    setUser(currentUser);

    if (!currentUser) {
      if (authRequestRef.current === requestId) {
        setProfile(null);
        setLoading(false);
      }
      return;
    }

    if (authRequestRef.current === requestId) {
      setProfile(undefined);
    }

    const nextProfile = await resolveProfile(currentUser);
    if (authRequestRef.current === requestId) {
      setProfile(nextProfile ?? null);
      setLoading(false);
    }
  }, [resolveProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    const nextProfile = await resolveProfile(user);
    setProfile(nextProfile ?? null);
    return nextProfile;
  }, [resolveProfile, user]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const syncSession = async (session) => {
      if (!isMounted) return;

      setLoading(true);
      try {
        await applySession(session);
      } catch (err) {
        console.error('Auth sync error:', err);
        if (!isMounted) return;

        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await syncSession(session);
      } catch (err) {
        console.error('Auth init error:', err);
        if (!isMounted) return;

        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event);
      void syncSession(session);
    });

    void initialize();

    return () => {
      isMounted = false;
      authRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
