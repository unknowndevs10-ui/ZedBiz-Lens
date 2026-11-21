import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { LogoMark } from '../components/common/Logo';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Input } from '../components/common/FormControls';
import { LoadingState } from '../components/common/States';
import { useAuth } from '../context/AuthContext';

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.43h3.14c1.84-1.7 2.91-4.2 2.91-7.21Z"/><path fill="#34A853" d="M12 21.6c2.62 0 4.82-.87 6.43-2.36l-3.14-2.43c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.31v2.5A9.72 9.72 0 0 0 12 21.6Z"/><path fill="#FBBC05" d="M6.56 13.73a5.84 5.84 0 0 1 0-3.72v-2.5H3.31a9.72 9.72 0 0 0 0 8.72l3.25-2.5Z"/><path fill="#EA4335" d="M12 6.02c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.81 3.1 14.62 2.16 12 2.16a9.72 9.72 0 0 0-8.69 5.35l3.25 2.5C7.33 7.73 9.47 6.02 12 6.02Z"/></svg>;
}

export default function LoginPage() {
  const { status, user, profileComplete, signIn, signUp, signInWithGoogle, requestPasswordReset, setAccountPassword, supabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signin');
  const location = useLocation();
  const navigate = useNavigate();
  const authParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  const accountAction = authParams.get('type') === 'invite' ? 'invite' : authParams.get('type') === 'recovery' || new URLSearchParams(location.search).has('reset') ? 'recovery' : '';

  if (user && status === 'ready' && !accountAction) {
    return <Navigate to={profileComplete ? location.state?.from || '/app/dashboard' : '/app/profile'} replace />;
  }
  if (status === 'loading' || status === 'checking') return <main className="min-h-screen bg-[#0b1112] px-4 pt-16"><LoadingState label="Opening your secure workspace" /></main>;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        if (password.length < 12) throw new Error('Choose a password with at least 12 characters.');
        if (password !== confirmPassword) throw new Error('Those passwords do not match yet.');
        const result = await signUp(email, password);
        if (result.emailConfirmationRequired) {
          setMessage('Check your email for a confirmation link. After confirming, return here to sign in and set up your business.');
        } else {
          navigate('/app/profile', { replace: true });
        }
      } else {
        await signIn(email, password);
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'We could not sign you in. Check your details and try again.');
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true); setError(''); setMessage('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in could not start. Check that the Google provider is enabled in Supabase.');
      setBusy(false);
    }
  }

  async function handleReset() {
    setError(''); setMessage('');
    if (!email.trim()) { setError('Enter your team email first, then choose reset password.'); return; }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setMessage('If this email belongs to a ZedBiz account, a secure reset link is on its way.');
    } catch (err) { setError(err.message || 'We could not send a reset link.'); }
    finally { setBusy(false); }
  }

  async function handleSetPassword(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    if (password.length < 12) { setBusy(false); setError('Choose a password with at least 12 characters.'); return; }
    if (password !== confirmPassword) { setBusy(false); setError('Those passwords do not match yet.'); return; }
    try {
      await setAccountPassword(password);
      navigate('/app/profile', { replace: true });
    } catch (err) { setError(err.message || 'We could not update your password.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1112] px-4 py-10 text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_25rem]">
        <section className="hidden max-w-xl lg:block">
          <Link to="/" className="inline-flex items-center gap-3"><LogoMark size={42} /><span className="text-xl font-extrabold">ZedBiz <span className="text-brand-300">Lens</span></span></Link>
          <p className="eyebrow mt-16">Built with UnknownDevs</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight">Business clarity,<br /><span className="text-brand-300">one step at a time.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">A thoughtful workspace for the way Zambian businesses really work. Create an account or sign in, then get to know your business step by step.</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-ink-muted"><span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-[#121a1b] text-brand-300"><Sparkles className="h-4 w-4" /></span>Made for your business, not a one-size-fits-all template.</div>
        </section>

        <Card className="animate-sheet p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden"><LogoMark size={36} /><span className="text-lg font-extrabold">ZedBiz <span className="text-brand-300">Lens</span></span></div>
          <div className="mb-7"><span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand-300"><LockKeyhole className="h-5 w-5" /></span><h2 className="text-2xl font-extrabold">{accountAction === 'invite' ? 'Set your password' : accountAction === 'recovery' ? 'Choose a new password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p className="mt-1.5 text-sm leading-6 text-ink-muted">{accountAction ? 'Secure your account before setting up your business.' : mode === 'signup' ? 'Start with an account. Your business setup follows after sign-up.' : 'Sign in to continue to your business workspace.'}</p></div>
          {!supabaseConfigured && <div role="alert" className="mb-5 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm leading-5 text-ink">Secure sign-in needs your Supabase project settings. Add the two Vite Supabase values, then restart the app.</div>}
          {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
          {message && <div role="status" className="mb-4 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand-100">{message}</div>}
          {location.search.includes('error=profile') && !error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">Your business profile could not be loaded. Sign in again or try later.</div>}
          {accountAction ? <form className="space-y-4" onSubmit={handleSetPassword}>
            {!user && <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Team email</span><Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>}
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">New password</span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="px-10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink focus-ring" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Confirm password</span><Input type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it once more" /></label>
            <Button type="submit" className="mt-2 w-full" loading={busy} disabled={!supabaseConfigured} icon={ArrowRight}>Save password & continue</Button>
          </form> : <>
            <button type="button" onClick={handleGoogle} disabled={busy || !supabaseConfigured} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-[#121a1b] text-sm font-bold text-ink transition hover:border-brand-300 hover:bg-[#172222] focus-ring disabled:opacity-50"><GoogleMark />Continue with Google</button>
            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-ink-muted"><span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" /></div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Email</span><span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="pl-10" /></span></label>
              <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Password</span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><Input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 12 : 8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'At least 12 characters' : 'Enter your password'} className="px-10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink focus-ring" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
              {mode === 'signup' && <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Confirm password</span><Input type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it once more" /></label>}
              <Button type="submit" className="mt-2 w-full" loading={busy} disabled={!supabaseConfigured} icon={ArrowRight}>{mode === 'signup' ? 'Create account' : 'Sign in with email'}</Button>
            </form>
          </>}
          {!accountAction && mode === 'signin' && <button type="button" onClick={handleReset} disabled={busy || !supabaseConfigured} className="mt-4 w-full rounded py-2 text-sm font-semibold text-brand-300 transition hover:text-brand-200 disabled:opacity-50">Forgot your password?</button>}
          {!accountAction && <p className="mt-4 text-center text-sm text-ink-muted">{mode === 'signup' ? 'Already have an account?' : 'New to ZedBiz Lens?'} <button type="button" disabled={busy} onClick={() => { setMode((current) => current === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} className="font-bold text-brand-300 hover:text-brand-200 focus-ring">{mode === 'signup' ? 'Sign in' : 'Create account'}</button></p>}
          <div className="mt-6 flex gap-2 border-t border-line pt-5 text-xs leading-5 text-ink-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" /><p>Your business profile is tied to your account. Sample records, when opened, stay separate from your own ledger.</p></div>
          <Link to="/" className="mt-5 block text-center text-xs font-semibold text-ink-muted transition hover:text-ink">Return to ZedBiz Lens</Link>
        </Card>
      </div>
    </main>
  );
}

