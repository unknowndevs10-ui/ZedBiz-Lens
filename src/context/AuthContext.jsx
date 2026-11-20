import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [accessError, setAccessError] = useState('');

  const checkAccess = useCallback(async (activeSession) => {
    if (!activeSession?.user) {
      setIsTeamMember(false);
      setBusinessProfile(null);
      setAccessError('');
      setStatus('signed_out');
      return false;
    }
    setStatus('checking');
    const teamEmail = String(activeSession.user.email || '').toLowerCase();
    const { data: member, error: accessCheckError } = await supabase
      .from('team_members')
      .select('email')
      .eq('email', teamEmail)
      .eq('active', true)
      .maybeSingle();
    if (accessCheckError || !member) {
      setIsTeamMember(false);
      setBusinessProfile(null);
      setAccessError(accessCheckError ? 'Could not verify team access. Please try again.' : 'This email is not on the UnknownDevs access list.');
      setStatus('denied');
      return false;
    }
    const { data, error: profileError } = await supabase
      .from('business_profiles')
      .select('profile, completed')
      .eq('user_id', activeSession.user.id)
      .maybeSingle();
    if (profileError) {
      setIsTeamMember(true);
      setAccessError('Your business profile could not be loaded. Check the connection and try again.');
      setStatus('error');
      return false;
    }
    setIsTeamMember(true);
    setBusinessProfile(data?.completed ? data.profile : null);
    setAccessError('');
    setStatus('ready');
    return true;
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus('unconfigured');
      return undefined;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAccessError('Could not restore your secure session. Sign in again.');
        setStatus('signed_out');
        return;
      }
      setSession(data.session);
      if (!data.session) setStatus('signed_out');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setIsTeamMember(false);
        setBusinessProfile(null);
        setStatus('signed_out');
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [checkAccess]);

  useEffect(() => {
    if (session) checkAccess(session);
  }, [session, checkAccess]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Secure sign-in is not configured yet.');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    setSession(data.session);
    const allowed = await checkAccess(data.session);
    if (!allowed) {
      await supabase.auth.signOut();
      throw new Error('This account is not on the active UnknownDevs access list.');
    }
    return data;
  }, [checkAccess, accessError]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setBusinessProfile(null);
    setIsTeamMember(false);
    setStatus('signed_out');
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    if (!supabase) throw new Error('Secure sign-in is not configured yet.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login?reset=1`,
    });
    if (error) throw error;
  }, []);

  const setAccountPassword = useCallback(async (password) => {
    if (!supabase) throw new Error('Secure sign-in is not configured yet.');
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    if (data.user) setSession((current) => current ? { ...current, user: data.user } : current);
  }, []);

  const saveBusinessProfile = useCallback(async (profile) => {
    if (!supabase || !session?.user) throw new Error('Your secure session has expired. Sign in again.');
    const { error } = await supabase.from('business_profiles').upsert({
      user_id: session.user.id,
      profile,
      completed: true,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setBusinessProfile(profile);
  }, [session]);

  const value = useMemo(() => ({
    user: session?.user || null,
    session,
    status,
    isTeamMember,
    businessProfile,
    accessError,
    signIn,
    signOut,
    requestPasswordReset,
    setAccountPassword,
    saveBusinessProfile,
    supabaseConfigured,
  }), [session, status, isTeamMember, businessProfile, accessError, signIn, signOut, requestPasswordReset, setAccountPassword, saveBusinessProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

