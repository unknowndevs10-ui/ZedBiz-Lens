import { createClient } from '@supabase/supabase-js';

const requestCounts = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_TEXT_LENGTH = 4_000;

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

function allowRequest(userId) {
  const now = Date.now();
  const recent = (requestCounts.get(userId) || []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requestCounts.set(userId, recent);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Method not allowed.');
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return fail(res, 401, 'Sign in to use voice playback.');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return fail(res, 503, 'Private voice service is not configured.');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user?.id || !user.email) return fail(res, 401, 'Your sign-in session could not be verified.');

  const email = String(user.email).trim().toLowerCase();
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('email')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();
  if (memberError || !member) return fail(res, 403, 'This account is not enabled for the private voice service.');
  if (!allowRequest(user.id)) return fail(res, 429, 'Voice playback is temporarily rate limited. Try again in a minute.');

  const text = String(req.body?.text || '').trim();
  if (!text || text.length > MAX_TEXT_LENGTH) return fail(res, 400, `Text must be between 1 and ${MAX_TEXT_LENGTH} characters.`);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return fail(res, 503, 'Private voice is not configured.');

  try {
    let voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId) {
      const voiceResponse = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': apiKey } });
      if (!voiceResponse.ok) return fail(res, 502, 'The voice service could not list available voices.');
      const voiceData = await voiceResponse.json();
      voiceId = voiceData.voices?.find((voice) => voice.category === 'premade')?.voice_id || voiceData.voices?.[0]?.voice_id;
    }
    if (!voiceId) return fail(res, 503, 'Choose an ElevenLabs voice before using voice playback.');

    const speechResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey, Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.55, similarity_boost: 0.72, style: 0.12, use_speaker_boost: true },
      }),
    });
    if (!speechResponse.ok) return fail(res, 502, 'The voice service could not create audio. You can use your device voice instead.');
    const audio = Buffer.from(await speechResponse.arrayBuffer());
    res.setHeader('Content-Type', speechResponse.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Content-Length', String(audio.length));
    return res.status(200).send(audio);
  } catch {
    return fail(res, 502, 'Private voice is temporarily unavailable.');
  }
}
