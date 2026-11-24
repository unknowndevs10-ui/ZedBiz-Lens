import { supabase } from '../lib/supabase';
import { LOCAL_GREETINGS } from '../data/languageGuide';

let activeAudio = null;
let activeObjectUrl = null;
let activePlayback = null;

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activePlayback) {
    activePlayback.resolve({ provider: 'elevenlabs', stopped: true });
    activePlayback = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

async function speakWithElevenLabs(text) {
  if (!supabase) throw new Error('Secure voice is unavailable.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in to use the private voice service.');
  const response = await fetch('/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('ElevenLabs voice is not configured.');
  const audioBlob = await response.blob();
  const url = URL.createObjectURL(audioBlob);
  activeObjectUrl = url;
  const audio = new Audio(url);
  activeAudio = audio;
  const release = () => {
    if (activeObjectUrl === url) {
      URL.revokeObjectURL(url);
      activeObjectUrl = null;
    }
    if (activeAudio === audio) activeAudio = null;
  };
  return new Promise((resolve, reject) => {
    activePlayback = { resolve, reject };
    audio.onended = () => {
      release();
      if (activePlayback?.resolve === resolve) activePlayback = null;
      resolve({ provider: 'elevenlabs' });
    };
    audio.onerror = () => {
      release();
      if (activePlayback?.reject === reject) activePlayback = null;
      reject(new Error('Audio playback failed.'));
    };
    audio.play().catch((error) => {
      release();
      if (activePlayback?.reject === reject) activePlayback = null;
      reject(error);
    });
  });
}

function speakWithDevice(text, language) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    throw new Error('This browser does not have speech playback. Read the on-screen welcome instead.');
  }
  stopSpeaking();
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'Bemba' || language === 'Nyanja' ? 'en-ZM' : 'en-ZA';
    utterance.rate = 0.94;
    utterance.pitch = 0.96;
    utterance.onend = () => resolve({ provider: 'device' });
    utterance.onerror = (event) => reject(new Error(event.error === 'canceled' ? 'Speech stopped.' : 'The device voice could not play.'));
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakBusinessText(text, language = 'English') {
  stopSpeaking();
  try {
    return await speakWithElevenLabs(text);
  } catch {
    return speakWithDevice(text, language);
  }
}

export function buildShortGreeting(profile = {}) {
  const greeting = LOCAL_GREETINGS[profile.language]?.greeting;
  return [greeting, `Welcome to ZedBiz Lens${profile.displayName ? `, ${profile.displayName}` : ''}. Your business. Your numbers. Your clarity.`].filter(Boolean).join(' ');
}
