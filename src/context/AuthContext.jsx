import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [accessError, setAccessError] = useState('');

  const checkAccess = useCallback(async (activeSession) => {
    if (!activeSession?.user) {
      setIsTeamMember(false);
      setBusinessProfile(null);
      setProfileComplete(false);
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
    // Team membership is retained for internal labels and future team-only features.
    // A business account can use its own profile even when it is not on that list.
    setIsTeamMember(Boolean(member) && !accessCheckError);
    const { data, error: profileError } = await supabase
      .from('business_profiles')
      .select('profile, completed')
      .eq('user_id', activeSession.user.id)
      .maybeSingle();
    if (profileError) {
      setIsTeamMember(Boolean(member) && !accessCheckError);
      setAccessError('Your business profile could not be loaded. Check the connection and try again.');
      setStatus('error');
      return false;
    }
    setBusinessProfile(data?.profile || null);
    setProfileComplete(Boolean(data?.completed));
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
        setProfileComplete(false);
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
      throw new Error('Your business profile could not be loaded. Check your connection and try again.');
    }
    return data;
  }, [checkAccess]);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Account creation is not configured yet.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      await checkAccess(data.session);
    }
    return { ...data, emailConfirmationRequired: !data.session };
  }, [checkAccess]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Google sign-in is not configured yet.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setBusinessProfile(null);
    setProfileComplete(false);
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

  const saveBusinessProfile = useCallback(async (profile, { completed = true, onboardingStep } = {}) => {
    if (!supabase || !session?.user) throw new Error('Your secure session has expired. Sign in again.');
    const savedProfile = { ...profile };
    if (completed) {
      delete savedProfile.onboardingStep;
      delete savedProfile.onboardingVersion;
    } else {
      savedProfile.onboardingVersion = 2;
      if (Number.isInteger(onboardingStep)) savedProfile.onboardingStep = onboardingStep;
    }
    const { error } = await supabase.from('business_profiles').upsert({
      user_id: session.user.id,
      profile: savedProfile,
      completed,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setBusinessProfile(savedProfile);
    setProfileComplete(completed);
  }, [session]);

  const value = useMemo(() => ({
    user: session?.user || null,
    session,
    status,
    isTeamMember,
    businessProfile,
    profileComplete,
    accessError,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    requestPasswordReset,
    setAccountPassword,
    saveBusinessProfile,
    supabaseConfigured,
  }), [session, status, isTeamMember, businessProfile, profileComplete, accessError, signIn, signUp, signInWithGoogle, signOut, requestPasswordReset, setAccountPassword, saveBusinessProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

