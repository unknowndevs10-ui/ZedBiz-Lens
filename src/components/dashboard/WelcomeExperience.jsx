import { useEffect, useMemo, useState } from 'react';
import { AudioLines, Check, Pause, Play, Sparkles, Waves } from 'lucide-react';
import Button from '../common/Button';
import WaveField from '../common/WaveField';
import { buildWelcomeScript, buildWelcomeSummary } from '../../data/voiceScripts';
import { LANGUAGE_SUPPORT_NOTE } from '../../data/languageGuide';
import { speakBusinessText, stopSpeaking } from '../../services/voiceService';
import { useAuth } from '../../context/AuthContext';

export default function WelcomeExperience({ ready, profile, openSignal = 0 }) {
  const { user } = useAuth();
  const key = `zedbiz-lens:welcome-seen:${user?.id || 'guest'}`;
  const fullScript = useMemo(() => buildWelcomeScript(profile || {}), [profile]);
  const script = useMemo(() => buildWelcomeSummary(profile || {}), [profile]);
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [motionEnabled, setMotionEnabled] = useState(() => {
    try { return localStorage.getItem('zedbiz-lens:welcome-motion') !== 'off'; } catch { return true; }
  });

  useEffect(() => {
    if (!ready || !user?.id) return;
    try { setOpen(localStorage.getItem(key) !== 'true'); } catch { setOpen(true); }
  }, [key, ready, user?.id]);

  useEffect(() => {
    if (ready && openSignal > 0) setOpen(true);
  }, [openSignal, ready]);

  useEffect(() => {
    if (!ready || !open || speaking) return;
    setError('');
    setSpeaking(true);
    speakBusinessText(script, profile?.language || 'English')
      .catch((cause) => setError(cause.message || 'Automatic playback was blocked. Choose Play welcome to hear the short introduction.'))
      .finally(() => setSpeaking(false));
  }, [ready, open, script, profile?.language]);

  function close() {
    stopSpeaking();
    setSpeaking(false);
    try { localStorage.setItem(key, 'true'); } catch { /* The welcome can still be closed without storage. */ }
    setOpen(false);
    setError('');
  }

  async function toggleSpeech() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setError('');
    setSpeaking(true);
    try { await speakBusinessText(script, profile?.language || 'English'); }
    catch (cause) { setError(cause.message || 'The voice could not start. You can read the introduction below.'); }
    finally { setSpeaking(false); }
  }

  function toggleMotion() {
    setMotionEnabled((current) => {
      const next = !current;
      try { localStorage.setItem('zedbiz-lens:welcome-motion', next ? 'on' : 'off'); } catch { /* Motion preference remains available for this session. */ }
      return next;
    });
  }

  if (!open) return null;

  return (
      <section aria-label="Welcome to ZedBiz Lens" className="mb-5 overflow-hidden rounded-2xl border border-line bg-[#121a1b] shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div><p className="eyebrow">Your welcome guide</p><h2 className="mt-0.5 text-sm font-extrabold">Welcome to ZedBiz Lens</h2></div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold text-ink-muted">Short introduction � about 30 seconds</span>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:p-5">
        <div className="overflow-hidden rounded-xl border border-line bg-[#0d1415]">
          <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-muted"><Sparkles className="h-4 w-4 text-accent" />YOUR FIRST BUSINESS BRIEF</div>
        </div>
        <div className="relative"><WaveField speaking={speaking} animationEnabled={motionEnabled} className="px-1" /><button type="button" onClick={toggleMotion} aria-pressed={!motionEnabled} className="focus-ring absolute bottom-2 right-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-[#111819]/90 px-2.5 py-1.5 text-[10px] font-bold text-ink-muted hover:text-ink"><Waves className="h-3.5 w-3.5" />Motion {motionEnabled ? 'on' : 'off'}</button></div>
        <div className="border-t border-line px-4 py-4">
          <p className="text-sm font-extrabold">Every kwacha has a story. See the whole picture.</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{profile?.language && profile.language !== 'English' ? `${profile.language} greeting � business guidance remains in English while local-language support is validated.` : 'A guide to recording, reviewing and understanding your business activity.'}</p>
        </div>
      </div>
      <div>
      <p className="text-sm leading-6 text-ink-muted">A short introduction to recording activity and understanding your business signals. Playback starts automatically when the dashboard opens, when your browser allows it.</p>
      <details className="mt-3 rounded-lg border border-line bg-[#0e1516] p-3">
        <summary className="cursor-pointer text-xs font-bold text-brand-700">Read the complete introduction</summary>
        <div className="mt-3 max-h-44 space-y-3 overflow-y-auto pr-1 text-xs leading-5 text-ink-muted">{fullScript.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </details>
      {profile?.language && profile.language !== 'English' && <p className="mt-3 text-[11px] leading-5 text-ink-muted">{LANGUAGE_SUPPORT_NOTE}</p>}
      {error && <p role="status" className="mt-3 rounded-lg border border-accent-100 bg-accent-50 p-3 text-xs leading-5 text-ink-muted">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={speaking ? Pause : Play} onClick={toggleSpeech}>{speaking ? 'Stop voice welcome' : 'Play voice welcome'}</Button>
        <Button variant="secondary" icon={Check} onClick={close}>Skip introduction</Button>
      </div>
      <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-ink-muted"><AudioLines className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" /><span>If your browser blocks autoplay, choose Play welcome once to allow it. You can skip this guide or replay it from the dashboard. Motion follows your reduced-motion preference.</span></div>
      </div>
      </div>
      </section>
  );
}

