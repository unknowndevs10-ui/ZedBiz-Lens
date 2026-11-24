import { useState } from 'react';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, Check, CircleHelp, CreditCard, FileCheck2, LockKeyhole, MapPin, Pencil, Sparkles, Store, WalletCards } from 'lucide-react';
import Button from '../components/common/Button';
import Notification from '../components/common/Notification';
import { Field, Input, Select } from '../components/common/FormControls';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const CHANNELS = [
  { id: 'cash', label: 'Cash', icon: WalletCards },
  { id: 'mobile_money', label: 'Mobile money', icon: CreditCard },
  { id: 'credit', label: 'Customer credit', icon: BriefcaseBusiness },
];
const GOALS = { records: 'Keep better records', profit: 'Understand profit', cashflow: 'Manage cash flow', tax_ready: 'Prepare for tax', growth: 'Grow the business' };
const CHALLENGES = { keeping_records: 'Keeping daily records', pricing: 'Setting prices and understanding profit', stock: 'Planning stock or supplies', cashflow: 'Managing cash flow', customer_credit: 'Tracking customer credit', tax: 'Understanding tax responsibilities', growth: 'Finding room to grow' };
const LEGAL_FORMS = { sole_trader: 'Sole trader', registered_business_name: 'Registered business name', limited_company: 'Limited company', partnership: 'Partnership', other: 'Not sure / other' };
const ACTIVITIES = { retail_trading: 'Retail or trading', agriculture: 'Agriculture', services: 'Services', consultancy: 'Consultancy', other: 'Other / needs review' };
const FORMALITY = {
  informal: { label: 'Informal · not registered', detail: 'You told us this business is currently operating informally.', tone: 'amber' },
  formalizing: { label: 'Awaiting registration', detail: 'You told us you are working towards formal registration.', tone: 'blue' },
  registered: { label: 'Owner reports registered', detail: 'You told us this business is formally registered. This status has not been checked against government records.', tone: 'green' },
};
const READINESS = { yes: 'Owner reports yes', no: 'Not yet', unsure: 'Not sure' };
const LANGUAGES = ['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi', 'Kaonde', 'Lunda', 'Luvale', 'Other'];
const BUSINESS_TYPES = ['Market trader', 'Retail shop', 'Food and hospitality', 'Salon or personal care', 'Professional services', 'Agriculture', 'Transport', 'Other'];
const DEFAULT_PROFILE = { displayName: '', role: 'Owner', businessName: '', businessType: 'Market trader', businessFormality: 'informal', province: 'Lusaka', district: '', language: 'English', legalForm: '', taxActivity: '', recordChannels: ['cash'], pacraStatus: 'unsure', zraStatus: 'unsure', vatStatus: 'unsure', formalizationInterest: 'yes', goals: ['records', 'profit'], biggestChallenge: 'keeping_records', operatingDaysPerWeek: '6' };
const humanize = (value) => String(value || 'Not provided').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Section({ icon: Icon, title, action, children, className = '' }) {
  return <section className={`rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>{title}</h2>{action}</div>{children}</section>;
}

function Detail({ label, value, hint }) {
  return <div className="min-w-0 border-t border-line py-3 first:border-0 first:pt-0 sm:first:border-t sm:first:pt-3"><p className="text-[11px] font-semibold text-ink-muted">{label}</p><p className="mt-1 break-words text-sm font-bold text-ink">{value || 'Not provided'}</p>{hint && <p className="mt-1 text-[11px] leading-5 text-ink-muted">{hint}</p>}</div>;
}

function StatusPill({ status }) {
  const styles = { yes: 'border-success/20 bg-success/10 text-success', no: 'border-line bg-surface text-ink-muted', unsure: 'border-accent/30 bg-accent/10 text-[#79541C]' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles.unsure}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'yes' ? 'bg-success' : status === 'no' ? 'bg-ink-muted' : 'bg-accent-700'}`} />{READINESS[status] || READINESS.unsure}</span>;
}

function ToggleChoice({ items, selected, onSelect, multiple = false }) {
  const values = multiple ? (Array.isArray(selected) ? selected : []) : [selected];
  return <div className="flex flex-wrap gap-2">{items.map(({ id, label, icon: Icon }) => { const active = values.includes(id); return <button key={id} type="button" aria-pressed={active} onClick={() => onSelect(id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-ring ${active ? 'border-brand bg-brand-50 text-brand-800' : 'border-line bg-white text-ink-muted hover:border-brand-200'}`}>{Icon && <Icon className="h-4 w-4" />}{label}{active && <Check className="h-3.5 w-3.5" />}</button>; })}</div>;
}

export default function AccountBusinessSettings() {
  const { businessProfile: cloudProfile, user, saveBusinessProfile: saveCloudProfile, setAccountPassword } = useAuth();
  const { businessProfile: localProfile, saveBusinessProfile: saveLocalProfile } = useData();
  const { toast } = useToast();
  const profile = cloudProfile || localProfile || DEFAULT_PROFILE;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...DEFAULT_PROFILE, ...profile }));
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const registration = FORMALITY[profile.businessFormality] || FORMALITY.informal;
  const selectedGoals = (profile.goals || []).map((goal) => GOALS[goal]).filter(Boolean);
  const selectedChannels = (profile.recordChannels || []).map((id) => CHANNELS.find((channel) => channel.id === id)?.label).filter(Boolean);
  const firstGoal = selectedGoals[0] || 'Keep better records';
  const readinessItems = [
    { key: 'pacraStatus', label: 'PACRA business registration' },
    { key: 'zraStatus', label: 'ZRA TPIN' },
    { key: 'vatStatus', label: 'VAT registration' },
  ];

  function beginEdit() {
    setDraft({ ...DEFAULT_PROFILE, ...profile, goals: [...(profile.goals || [])], recordChannels: [...(profile.recordChannels || [])] });
    setEditing(true);
  }

  function update(key, value) { setDraft((current) => ({ ...current, [key]: value })); }
  function toggleList(key, value) { setDraft((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] })); }

  async function saveProfile(event) {
    event.preventDefault();
    if (!draft.displayName.trim() || !draft.businessName.trim() || !draft.recordChannels.length || !draft.goals.length || !draft.legalForm || !draft.taxActivity) {
      toast('Add a name, business name, one payment method, one priority, legal form and main activity before saving.', { tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const clean = saveLocalProfile(draft);
      await saveCloudProfile(clean, { completed: true });
      setDraft({ ...DEFAULT_PROFILE, ...clean });
      setEditing(false);
      toast('Your business information is up to date.', { tone: 'success' });
    } catch (error) {
      toast(error.message || 'We could not save these changes. Check your connection and try again.', { tone: 'danger', title: 'Changes not saved' });
    } finally { setSaving(false); }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (password.length < 12) { toast('Use at least 12 characters for your new password.', { tone: 'warning' }); return; }
    if (password !== confirmPassword) { toast('The passwords do not match yet.', { tone: 'warning' }); return; }
    setSaving(true);
    try {
      await setAccountPassword(password);
      setPassword(''); setConfirmPassword(''); setPasswordOpen(false);
      toast('Your password has been updated.', { tone: 'success' });
    } catch (error) { toast(error.message || 'Password could not be updated. Sign in again and retry.', { tone: 'danger' }); }
    finally { setSaving(false); }
  }

  if (editing) return <main className="mx-auto max-w-5xl px-1 py-4 sm:px-3 sm:py-8">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">ACCOUNT & BUSINESS</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Edit business information</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Everything is on one page. Save when you are ready; this will not restart onboarding or replace your ledger.</p></div><Button variant="secondary" icon={ArrowLeft} onClick={() => setEditing(false)}>Back to overview</Button></header>
    <form onSubmit={saveProfile} className="space-y-4">
      <Section icon={Building2} title="Business identity"><div className="grid gap-4 sm:grid-cols-2"><Field label="Business or trading name">{(props) => <Input {...props} required maxLength={80} value={draft.businessName} onChange={(e) => update('businessName', e.target.value)} />}</Field><Field label="Main type of business">{(props) => <Select {...props} value={draft.businessType} onChange={(e) => update('businessType', e.target.value)}>{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</Select>}</Field><Field label="Owner or contact name">{(props) => <Input {...props} required maxLength={50} value={draft.displayName} onChange={(e) => update('displayName', e.target.value)} />}</Field><Field label="Your role">{(props) => <Select {...props} value={draft.role} onChange={(e) => update('role', e.target.value)}>{['Owner', 'Co-owner', 'Manager', 'Bookkeeper', 'Other'].map((role) => <option key={role}>{role}</option>)}</Select>}</Field></div><div className="mt-5"><p className="mb-2 text-xs font-bold">Business registration journey</p><ToggleChoice selected={draft.businessFormality} onSelect={(value) => update('businessFormality', value)} items={[{ id: 'informal', label: 'Informal / not registered' }, { id: 'formalizing', label: 'Working towards registration' }, { id: 'registered', label: 'Registered' }]} /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Legal form">{(props) => <Select {...props} required value={draft.legalForm} onChange={(e) => update('legalForm', e.target.value)}><option value="">Choose one</option>{Object.entries(LEGAL_FORMS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select>}</Field><Field label="Main business activity">{(props) => <Select {...props} required value={draft.taxActivity} onChange={(e) => update('taxActivity', e.target.value)}><option value="">Choose one</option>{Object.entries(ACTIVITIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select>}</Field></div></Section>
      <Section icon={MapPin} title="Where and how you trade"><div className="grid gap-4 sm:grid-cols-2"><Field label="Province">{(props) => <Select {...props} value={draft.province} onChange={(e) => update('province', e.target.value)}>{['Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'].map((province) => <option key={province}>{province}</option>)}</Select>}</Field><Field label="District, market or area">{(props) => <Input {...props} maxLength={80} value={draft.district} onChange={(e) => update('district', e.target.value)} placeholder="For example, Soweto Market" />}</Field><Field label="Preferred language">{(props) => <Select {...props} value={draft.language} onChange={(e) => update('language', e.target.value)}>{LANGUAGES.map((language) => <option key={language}>{language}</option>)}</Select>}</Field><Field label="Usual trading days per week">{(props) => <Select {...props} value={draft.operatingDaysPerWeek} onChange={(e) => update('operatingDaysPerWeek', e.target.value)}>{[1,2,3,4,5,6,7].map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}</Select>}</Field></div><div className="mt-5"><p className="mb-2 text-xs font-bold">How customers usually pay</p><ToggleChoice selected={draft.recordChannels} multiple onSelect={(value) => toggleList('recordChannels', value)} items={CHANNELS} /></div></Section>
      <Section icon={FileCheck2} title="Registration and tax readiness"><p className="mb-4 text-xs leading-5 text-ink-muted">These are your own status answers. ZedBiz does not verify them with PACRA or ZRA, and this page does not file anything.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="PACRA registration status">{(props) => <Select {...props} value={draft.pacraStatus} onChange={(e) => update('pacraStatus', e.target.value)}><option value="yes">Yes, registered</option><option value="no">Not yet</option><option value="unsure">Not sure</option></Select>}</Field><Field label="ZRA TPIN status">{(props) => <Select {...props} value={draft.zraStatus} onChange={(e) => update('zraStatus', e.target.value)}><option value="yes">Yes, have one</option><option value="no">Not yet</option><option value="unsure">Not sure</option></Select>}</Field><Field label="VAT registration status">{(props) => <Select {...props} value={draft.vatStatus} onChange={(e) => update('vatStatus', e.target.value)}><option value="yes">Yes, registered</option><option value="no">Not yet</option><option value="unsure">Not sure</option></Select>}</Field>{draft.businessFormality !== 'registered' && <Field label="Formalization guidance">{(props) => <Select {...props} value={draft.formalizationInterest} onChange={(e) => update('formalizationInterest', e.target.value)}><option value="yes">Yes, guide me</option><option value="unsure">I am exploring</option><option value="no">Not right now</option></Select>}</Field>}</div></Section>
      <Section icon={Sparkles} title="What you want help with"><p className="mb-2 text-xs font-bold">Your priorities</p><ToggleChoice selected={draft.goals} multiple onSelect={(value) => toggleList('goals', value)} items={Object.entries(GOALS).map(([id, label]) => ({ id, label }))} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Biggest challenge right now">{(props) => <Select {...props} value={draft.biggestChallenge} onChange={(e) => update('biggestChallenge', e.target.value)}>{Object.entries(CHALLENGES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select>}</Field><div className="rounded-xl bg-brand-50 p-4"><p className="text-xs font-extrabold text-brand-800">How ZedBiz uses this context</p><p className="mt-1 text-xs leading-5 text-ink-muted">Your guidance will prioritize {draft.goals.map((goal) => GOALS[goal]).filter(Boolean).join(', ') || 'your selected business goals'} and use {draft.language || 'your preferred language'} for examples. It does not train an AI model.</p></div></div></Section>
      <div className="sticky bottom-3 flex flex-wrap justify-end gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-pop backdrop-blur"><Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" icon={Check} loading={saving}>Save business information</Button></div>
    </form>
  </main>;

  return <main className="mx-auto max-w-6xl px-1 py-4 sm:px-3 sm:py-8">
    <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center sm:p-7"><div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Store className="h-7 w-7" /></div><div className="min-w-0"><p className="eyebrow">YOUR BUSINESS PROFILE</p><h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.businessName || 'Your business'}</h1><p className="mt-1 text-sm text-ink-muted">{[profile.businessType, profile.district, profile.province].filter(Boolean).join(' · ')}</p></div></div><Button icon={Pencil} onClick={beginEdit}>Edit business information</Button></header>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.8fr)]">
      <div className="space-y-4">
        <Section icon={Building2} title="Business at a glance"><div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4"><span className={`grid h-10 w-10 place-items-center rounded-xl ${registration.tone === 'green' ? 'bg-success/10 text-success' : registration.tone === 'amber' ? 'bg-accent/15 text-[#79541C]' : 'bg-brand-50 text-brand-700'}`}><BadgeCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{registration.label}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{registration.detail}</p></div><span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-bold text-ink-muted">Self-reported</span></div><div className="grid gap-x-6 sm:grid-cols-2"><Detail label="Business type" value={profile.businessType} /><Detail label="Legal form" value={LEGAL_FORMS[profile.legalForm] || 'Not provided'} /><Detail label="Main activity" value={ACTIVITIES[profile.taxActivity] || 'Not provided'} /><Detail label="Location" value={[profile.district, profile.province].filter(Boolean).join(', ')} /><Detail label="Owner / contact" value={`${profile.displayName || 'Not provided'} · ${profile.role || 'Owner'}`} /><Detail label="Usual trading days" value={`${profile.operatingDaysPerWeek || '—'} days per week`} /></div></Section>
        <Section icon={WalletCards} title="How you work"><div className="grid gap-x-6 sm:grid-cols-2"><Detail label="Customer payment methods" value={selectedChannels.join(', ')} /><Detail label="Preferred language" value={profile.language} /><Detail label="Biggest current challenge" value={CHALLENGES[profile.biggestChallenge] || humanize(profile.biggestChallenge)} /><Detail label="Formalization guidance" value={profile.formalizationInterest === 'yes' ? 'Would like guidance' : profile.formalizationInterest === 'no' ? 'Not right now' : 'Still exploring'} /></div></Section>
        <Section icon={FileCheck2} title="Registration readiness"><div className="grid gap-3 sm:grid-cols-3">{readinessItems.map(({ key, label }) => <div key={key} className="rounded-xl border border-line bg-surface p-3"><p className="mb-2 text-[11px] font-semibold leading-4 text-ink-muted">{label}</p><StatusPill status={profile[key] || 'unsure'} /></div>)}</div><Notification tone="info" title="Status is self-reported" className="mt-4">ZedBiz has not verified these answers with PACRA or ZRA. No TPIN, registration number or government account is stored here.</Notification></Section>
      </div>
      <aside className="space-y-4">
        <Section icon={LockKeyhole} title="Account settings"><p className="break-all text-sm font-bold">{user?.email || 'Account email unavailable'}</p><p className="mt-1 text-xs text-ink-muted">{user?.email_confirmed_at || user?.confirmed_at ? 'Email confirmed' : 'Email confirmation status unavailable'}</p><div className="mt-4 border-t border-line pt-4"><button type="button" onClick={() => setPasswordOpen((open) => !open)} className="text-xs font-bold text-brand-700 hover:underline">{passwordOpen ? 'Close password update' : 'Change account password'}</button>{passwordOpen && <form className="mt-3 space-y-3" onSubmit={updatePassword}><Field label="New password" hint="Use at least 12 characters.">{(props) => <Input {...props} type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} />}</Field><Field label="Confirm new password">{(props) => <Input {...props} type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}</Field><Button type="submit" size="sm" loading={saving}>Update password</Button></form>}<Button className="mt-4 w-full" to="/app/settings" variant="secondary" icon={Sparkles}>Appearance & layout</Button></div></Section>
        <Section icon={Sparkles} title="Your business context"><p className="text-sm leading-6 text-ink-muted">ZedBiz is set up around <strong className="text-ink">{profile.businessType || 'your business'}</strong>. Guidance will put <strong className="text-ink">{firstGoal.toLowerCase()}</strong> first, reflect your <strong className="text-ink">{profile.language || 'English'}</strong> preference, and organize capture around {selectedChannels.length ? selectedChannels.join(', ').toLowerCase() : 'your selected payment methods'}.</p><div className="mt-4 flex flex-wrap gap-2">{selectedGoals.map((goal) => <span key={goal} className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-800">{goal}</span>)}</div><p className="mt-4 text-[11px] leading-5 text-ink-muted">This context personalizes the experience. It does not train a model, invent records, or change confirmed figures.</p></Section>
        <Section icon={CircleHelp} title="Need to change something?"><p className="text-xs leading-5 text-ink-muted">Edit business details at any time from this page. Changes update your guidance context; your existing ledger entries stay in place.</p><Button className="mt-3 w-full" variant="secondary" icon={Pencil} onClick={beginEdit}>Edit business information</Button></Section>
      </aside>
    </div>
  </main>;
}
