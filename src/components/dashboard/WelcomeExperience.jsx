import { useEffect, useMemo, useState } from 'react';
import { AudioLines, Check, Pause, Play, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import WaveField from '../common/WaveField';
import { buildWelcomeScript } from '../../data/voiceScripts';
import { LANGUAGE_SUPPORT_NOTE } from '../../data/languageGuide';
import { speakBusinessText, stopSpeaking } from '../../services/voiceService';
import { useAuth } from '../../context/AuthContext';

export default function WelcomeExperience({ ready, profile, openSignal = 0 }) {
  const { user } = useAuth();
  const key = `zedbiz-lens:welcome-seen:${user?.id || 'guest'}`;
  const script = useMemo(() => buildWelcomeScript(profile || {}), [profile]);
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !user?.id) return;
    try { setOpen(localStorage.getItem(key) !== 'true'); } catch { setOpen(true); }
  }, [key, ready, user?.id]);

  useEffect(() => {
    if (ready && openSignal > 0) setOpen(true);
  }, [openSignal, ready]);

  function close() {
    stopSpeaking();
    setSpeaking(false);
    try { localStorage.setItem(key, 'true'); } catch { /* The welcome can still be closed without storage. */ }
    setOpen(false);
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

  return (
    <Modal open={open} onClose={close} title="Welcome to ZedBiz Lens" description="A one-time introduction to your business workspace.">
      <div className="overflow-hidden rounded-xl border border-line bg-[#0d1415]">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-muted"><Sparkles className="h-4 w-4 text-accent" />YOUR FIRST BUSINESS BRIEF</div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold text-ink-muted">about 3 minutes</span>
        </div>
        <WaveField speaking={speaking} className="px-1" />
        <div className="border-t border-line px-4 py-4">
          <p className="text-sm font-extrabold">Every kwacha has a story. See the whole picture.</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{profile?.language && profile.language !== 'English' ? `${profile.language} greeting � business guidance remains in English while local-language support is validated.` : 'A guide to recording, reviewing and understanding your business activity.'}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-muted">Your account is ready. This introduction explains how the business brain uses your chosen goals and confirmed records while leaving every decision in your hands.</p>
      <details className="mt-3 rounded-lg border border-line bg-[#0e1516] p-3">
        <summary className="cursor-pointer text-xs font-bold text-brand-700">Read the welcome text</summary>
        <div className="mt-3 max-h-44 space-y-3 overflow-y-auto pr-1 text-xs leading-5 text-ink-muted">{script.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </details>
      {profile?.language && profile.language !== 'English' && <p className="mt-3 text-[11px] leading-5 text-ink-muted">{LANGUAGE_SUPPORT_NOTE}</p>}
      {error && <p role="status" className="mt-3 rounded-lg border border-accent-100 bg-accent-50 p-3 text-xs leading-5 text-ink-muted">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={speaking ? Pause : Play} onClick={toggleSpeech}>{speaking ? 'Stop voice welcome' : 'Play voice welcome'}</Button>
        <Button variant="secondary" icon={Check} onClick={close}>Continue to my dashboard</Button>
      </div>
      <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-ink-muted"><AudioLines className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" /><span>Voice starts only when you choose to play it. Replay this orientation from your dashboard at any time.</span></div>
    </Modal>
  );
}

