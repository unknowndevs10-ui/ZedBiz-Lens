import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Bot, Check, CircleHelp, Clock3, Headphones, Mic, MicOff, RotateCcw, Send, ShieldCheck, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { insightsService } from '../services/insightsService';
import { AGENT_MODEL_INFO, interpretAgentInput } from '../services/agentService';
import { config } from '../config';
import { getAgentEvents, getSampleAgentEvents, recordAgentEvent } from '../services/agentLog';
import { formatKwacha, formatDate } from '../utils/format';

const QUICK_PROMPTS = [
  'I sold bread for K120',
  'Paid rent of K1200',
  'Give me a business summary',
];

function timeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Just now';
  return new Intl.DateTimeFormat('en-ZM', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function SampleStatus({ label }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-accent-100 bg-accent-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-800"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{label}</span>;
}

function AgentOrb({ thinking = false }) {
  return (
    <div className={`agent-orb ${thinking ? 'agent-orb-thinking' : ''}`} aria-hidden="true">
      <span className="agent-orb-core"><Bot className="h-7 w-7" /></span>
      <i /><i /><i />
    </div>
  );
}

export default function AgentPage() {
  const { business, businessProfile, businessId, transactions, submitAgentDraft } = useData();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [eventVersion, setEventVersion] = useState(0);
  const events = useMemo(() => getAgentEvents(businessId), [businessId, eventVersion]);
  const [messages, setMessages] = useState([{ id: 'welcome', role: 'agent', text: `Hi${businessProfile?.businessName ? `, ${businessProfile.businessName}` : business?.name ? `, ${business.name}` : ''}. I can prepare a transaction draft or summarize the confirmed records for this workspace. You stay in control of every change.` }]);
  const sampleEvents = useMemo(() => getSampleAgentEvents(business?.name), [business?.name]);
  const supportsVoice = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  function addMessage(role, text, details = null) {
    setMessages((current) => [...current.slice(-7), { id: `${Date.now()}-${Math.random()}`, role, text, details }]);
  }

  function speak(text) {
    if (!voiceReplies || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-ZA';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function saveLog(type, message, intent) {
    recordAgentEvent({ businessId, type, message, intent });
    setEventVersion((version) => version + 1);
  }

  async function handlePrompt(rawText) {
    const text = String(rawText || '').trim();
    if (!text || busy) return;
    setInput('');
    addMessage('owner', text);
    setBusy(true);
    try {
      const result = await interpretAgentInput(text, businessProfile);
      if (result.kind === 'clarify') {
        addMessage('agent', result.message, { label: 'Needs a clearer instruction', reasons: ['low_or_unsupported_intent'] });
        saveLog('clarify', 'The model held an unclear note and asked for clarification.', result.prediction?.intent || 'unknown');
        speak(result.message);
        return;
      }
      if (result.kind === 'summary') {
        const summary = await insightsService.getDashboard({ businessId, period: '30d' });
        const response = `For ${business?.name || 'this business'} in the last 30 days, the confirmed ledger shows ${formatKwacha(summary.summary.sales)} in sales, ${formatKwacha(summary.summary.expenses)} in expenses, and ${formatKwacha(summary.summary.netProfit)} net profit before tax. This is a deterministic 30-day summary, even if your wording asked about a shorter period.`;
        addMessage('agent', response, { label: '30-day summary tool', stats: summary.summary });
        saveLog('summary', 'Calculated a 30-day summary from confirmed demo entries.', 'summary');
        speak(response);
        return;
      }

      const duplicate = transactions.some((transaction) => transaction.source?.trim().toLowerCase() === text.toLowerCase() && transaction.amount === result.draft.amount && transaction.type === result.draft.type && transaction.status !== 'rejected');
      if (duplicate) {
        const response = 'This looks like a note already in your ledger. I have not created another draft.';
        addMessage('agent', response, { label: 'Possible duplicate', reasons: ['matching_note_and_amount'] });
        saveLog('duplicate', 'Held a possible duplicate before saving a second draft.', result.prediction.intent);
        speak(response);
        return;
      }
      setPendingDraft({ source: text, ...result.draft, model: result.prediction });
      const response = `I understood this as a ${result.draft.type === 'income' ? 'sale' : 'business expense'} for ${formatKwacha(result.draft.amount)}. I have prepared a draft only. Please review it before adding it to your transaction queue.`;
      addMessage('agent', response, { label: 'Draft prepared', reasons: ['synthetic_training_only', 'owner_confirmation_required'] });
      saveLog('draft', 'Prepared a draft entry and held it for owner confirmation.', result.prediction.intent);
      speak(response);
    } catch (error) {
      const response = error.message || 'I could not complete that step. Please try again.';
      addMessage('agent', response, { label: 'Action stopped' });
      saveLog('error', 'A demo tool action stopped with an error.', null);
      toast(response, { tone: 'danger', title: 'Agent action stopped' });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDraft() {
    if (!pendingDraft || busy) return;
    setBusy(true);
    try {
      await submitAgentDraft({ text: pendingDraft.source, draft: pendingDraft });
      const response = 'Added to Needs your review. It will not affect your dashboard or tax view until you confirm it there.';
      addMessage('agent', response, { label: 'Saved as pending', reasons: ['not_counted_until_confirmed'] });
      saveLog('queued', 'Saved one draft to the pending review queue.', pendingDraft.type === 'income' ? 'sale' : 'expense');
      setPendingDraft(null);
      toast('Draft added to the review queue.');
      speak(response);
    } catch (error) {
      toast(error.message || 'The draft could not be saved.', { tone: 'danger', title: 'Could not save draft' });
    } finally {
      setBusy(false);
    }
  }

  function discardDraft() {
    if (!pendingDraft) return;
    setPendingDraft(null);
    addMessage('agent', 'Draft discarded. Nothing was added to your records.', { label: 'No change made' });
    saveLog('discard', 'Owner discarded a suggested draft before it entered the review queue.', pendingDraft.type === 'income' ? 'sale' : 'expense');
  }

  function startVoice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return toast('Voice input is unavailable in this browser. You can type the same note.', { tone: 'warning' });
    const recognition = new Recognition();
    recognition.lang = 'en-ZA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast('Voice capture did not work. You can type the note instead.', { tone: 'warning' });
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
      if (transcript) handlePrompt(transcript);
    };
    try { recognition.start(); } catch { setListening(false); }
  }

  const visibleEvents = events.length ? events : sampleEvents;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">ZEDBIZ LENS · AGENT LAB</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">A calm assistant for the work behind the numbers.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">It can sort an instruction, prepare a record, and run a clear summary tool. Every record waits for you to review it.</p>
          {businessProfile ? <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-line bg-[#121a1b] px-3 py-2 text-xs text-ink-muted"><span className="font-bold text-ink">Workspace context:</span>{businessProfile.businessName} · {businessProfile.businessType}{businessProfile.location ? ` · ${businessProfile.location}` : ''} · records by {businessProfile.recordChannels.map((channel) => channel.replace('_', ' ')).join(', ')} · {businessProfile.language} preference</p> : <p className="mt-3 text-xs text-ink-muted">Set up your own ledger on the <Link to="/app/profile" className="font-bold text-brand-700 underline">business profile page</Link>.</p>}
        </div>
        <SampleStatus label="Synthetic model · demo" />
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.8fr)]">
        <Card className="overflow-hidden">
          <div className="agent-header relative flex min-h-44 items-center gap-5 overflow-hidden px-5 py-6 text-white sm:px-8">
            <div className="agent-header-glow" aria-hidden="true" />
            <AgentOrb thinking={busy} />
            <div className="relative z-10 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold">ZedBiz Agent</h2>
                <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{busy ? 'Working' : 'Ready'}</span>
              </div>
              <p className="mt-1 max-w-lg text-sm leading-6 text-white/80">{AGENT_MODEL_INFO.name} · {config.agentApiBaseUrl ? 'connected synthetic service' : `${AGENT_MODEL_INFO.examples} fictional phrase examples · runs in this browser`}</p>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6" aria-live="polite" aria-busy={busy}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'owner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'owner' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-surface text-ink'}`}>
                  <p>{message.text}</p>
                  {message.details?.label && <p className={`mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${message.role === 'owner' ? 'text-white/70' : 'text-brand-700'}`}>{message.details.label}</p>}
                  {message.details?.stats && <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-[#121a1b] px-2.5 py-1.5 font-semibold text-ink">Sales {formatKwacha(message.details.stats.sales)}</span><span className="rounded-lg bg-[#121a1b] px-2.5 py-1.5 font-semibold text-ink">Expenses {formatKwacha(message.details.stats.expenses)}</span><span className="rounded-lg bg-[#121a1b] px-2.5 py-1.5 font-semibold text-ink">Net {formatKwacha(message.details.stats.netProfit)}</span></div>}
                  {message.details?.reasons && <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted">{message.details.reasons.map((reason) => <li key={reason} className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-brand" />{reason.replaceAll('_', ' ')}</li>)}</ul>}
                </div>
              </div>
            ))}

            {pendingDraft && (
              <div className="rounded-2xl border border-brand/20 bg-brand-50/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-sm font-extrabold text-brand-800">Check the suggested entry</p><p className="mt-1 text-xs text-ink-muted">The model proposes. You decide whether to add it.</p></div>
                  <span className="rounded-full bg-[#121a1b] px-2.5 py-1 text-xs font-bold text-brand-800">Predicted type · review required</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-ink-muted">Type</dt><dd className="mt-0.5 font-bold">{pendingDraft.type === 'income' ? 'Sale' : 'Expense'}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Amount</dt><dd className="mt-0.5 font-bold">{formatKwacha(pendingDraft.amount)}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Category</dt><dd className="mt-0.5 font-bold">{pendingDraft.category}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Date</dt><dd className="mt-0.5 font-bold">{formatDate(pendingDraft.date)}</dd></div>
                </dl>
                <p className="mt-3 rounded-lg bg-[#0e1516]/80 px-3 py-2 text-xs text-ink-muted">{pendingDraft.description}</p>
                <div className="mt-4 flex flex-wrap gap-2"><Button icon={Check} onClick={confirmDraft} loading={busy}>Add to review queue</Button><Button variant="secondary" icon={Trash2} onClick={discardDraft} disabled={busy}>Discard draft</Button></div>
                {pendingDraft.type === 'income' && <p className="mt-3 text-xs font-medium text-accent-800">Tax label is set to “unsure” until you review it. The agent never makes the tax decision.</p>}
              </div>
            )}

            <form onSubmit={(event) => { event.preventDefault(); handlePrompt(input); }} className="rounded-2xl border border-line bg-[#121a1b] p-2 shadow-card">
              <label className="sr-only" htmlFor="agent-message">Tell the agent what happened or ask about your business</label>
              <textarea id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} rows={2} placeholder="For example: I sold bread for K120" className="field min-h-20 resize-y border-0 bg-transparent shadow-none focus:ring-0" disabled={busy} />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-line px-1 pt-2">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={startVoice} disabled={!supportsVoice || busy} aria-label={listening ? 'Listening' : 'Speak an instruction'} title={!supportsVoice ? 'Voice input is not available in this browser' : 'Speak an instruction in English'} className={`focus-ring flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${listening ? 'bg-danger/10 text-danger' : 'text-ink-muted hover:bg-surface'} disabled:cursor-not-allowed disabled:opacity-40`}>
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{listening ? 'Listening…' : 'Speak'}
                  </button>
                  <button type="button" onClick={() => { const next = !voiceReplies; setVoiceReplies(next); if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }} aria-pressed={voiceReplies} className="focus-ring flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink-muted hover:bg-surface">
                    {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{voiceReplies ? 'Voice on' : 'Voice off'}
                  </button>
                </div>
                <div className="flex items-center gap-2"><span className="hidden text-[11px] text-ink-muted sm:inline">{input.length}/500</span><Button type="submit" icon={Send} loading={busy} disabled={!input.trim()}>Send</Button></div>
              </div>
            </form>
            <p className="px-1 text-[11px] leading-5 text-ink-muted">Voice recognition is browser-provided and may use that browser’s speech service. Use typing for this local-only demo. Voice is English only; local-language support needs its own data and validation.</p>

            <div className="flex flex-wrap gap-2 pt-1" aria-label="Try a sample instruction">
              {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => handlePrompt(prompt)} disabled={busy} className="focus-ring rounded-full border border-line bg-[#121a1b] px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand/30 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50">{prompt}</button>)}
            </div>
          </div>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="What the agent can do" description="A small, inspectable demo brain" />
            <div className="space-y-3 px-5 pb-5">
              {[
                [Sparkles, 'Interpret a short note', 'Classifies sale, expense, summary, or unknown using fictional English examples.'],
                [Activity, 'Use the business ledger', 'Calls the deterministic 30-day summary tool on confirmed synthetic records.'],
                [ShieldCheck, 'Prepare a review draft', 'Leaves entries pending until you confirm them in Transactions.'],
              ].map(([Icon, title, body]) => <div key={title} className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-xs leading-5 text-ink-muted">{body}</p></div></div>)}
            </div>
            <div className="border-t border-line px-5 py-4"><p className="flex items-center gap-2 text-xs font-bold text-accent-800"><CircleHelp className="h-4 w-4" />What it will not do</p><p className="mt-1 text-xs leading-5 text-ink-muted">It will not set tax treatment, calculate tax owed, file returns, move money, or write a confirmed record on its own.</p></div>
          </Card>

          <Card>
            <CardHeader title="Agent activity" description="Small, reviewable event trail" action={<span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted"><Clock3 className="h-3.5 w-3.5" />On this device</span>} />
            <ol className="space-y-4 px-5 pb-5">
              {visibleEvents.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${event.type === 'guardrail' || event.type === 'clarify' ? 'bg-accent-50 text-accent-800' : 'bg-brand-50 text-brand'} `}><Activity className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold capitalize">{event.type.replaceAll('-', ' ')}</span><time className="text-[10px] text-ink-muted">{timeLabel(event.createdAt)}</time></div><p className="mt-0.5 text-xs leading-5 text-ink-muted">{event.message}</p>{event.synthetic && <span className="mt-1 inline-flex rounded bg-accent-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-800">Sample replay</span>}</div>
                </li>
              ))}
            </ol>
            <div className="border-t border-line px-5 py-3"><p className="text-[11px] leading-5 text-ink-muted">Logs store event type and outcome, not your message text. Sample replay rows are fictional. Clearing demo data from the sidebar also clears local agent history.</p></div>
          </Card>

          <Card className="border-brand/15 bg-brand-50/50 p-4"><div className="flex gap-3"><Headphones className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><div><p className="text-xs font-bold">Designed for a gradual rollout</p><p className="mt-1 text-xs leading-5 text-ink-muted">This synthetic English baseline is a wiring demo only. Measure real-world intent, accent, and language performance before adding a model to live records.</p><Link to="/app/transactions" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-800 hover:underline">Review transaction queue <ArrowRight className="h-3.5 w-3.5" /></Link></div></div></Card>
          <button type="button" onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setMessages([{ id: 'welcome-reset', role: 'agent', text: `Hi${business?.name ? `, ${business.name}` : ''}. I can prepare a transaction draft or summarize the confirmed demo records. You stay in control of every change.` }]); setPendingDraft(null); }} className="focus-ring flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-ink-muted hover:bg-[#121a1b]"><RotateCcw className="h-3.5 w-3.5" />Clear conversation</button>
        </aside>
      </div>
    </div>
  );
}
