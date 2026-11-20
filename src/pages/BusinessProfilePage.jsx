import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Check, CircleHelp, CreditCard, MapPin, ShieldCheck, Sparkles, Store, WalletCards } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Notification from '../components/common/Notification';
import { Field, Input, Select } from '../components/common/FormControls';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const STEPS = ['You', 'Business', 'How you work', 'Registration', 'Review'];
const CHANNELS = [
  { id: 'cash', label: 'Cash', detail: 'Notes, coins, and daily takings', icon: WalletCards },
  { id: 'mobile_money', label: 'Mobile money', detail: 'Mobile wallet payments', icon: CreditCard },
  { id: 'credit', label: 'Customer credit', detail: 'Sales customers pay later', icon: BriefcaseBusiness },
];
const FORMALITY = [
  { id: 'informal', title: 'Informal or not registered', detail: 'I trade without formal business registration.', icon: Store },
  { id: 'formalizing', title: 'Working towards registration', detail: 'I am starting or planning to formalise.', icon: Sparkles },
  { id: 'registered', title: 'Formally registered', detail: 'My business has official registration.', icon: BadgeCheck },
];
const DEFAULT_FORM = {
  displayName: '', role: 'Owner', businessName: '', businessType: 'Market trader',
  businessFormality: 'informal', province: 'Lusaka', district: '', language: 'English',
  recordChannels: ['cash'], pacraStatus: 'unsure', zraStatus: 'unsure',
  vatStatus: 'unsure', formalizationInterest: 'yes',
};

function ChoiceCards({ items, value, onChange, columns = 3 }) {
  return (
    <div className={'grid gap-3 ' + (columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.map(({ id, title, detail, icon: Icon }) => {
        const selected = value === id;
        return <button key={id} type="button" aria-pressed={selected} onClick={() => onChange(id)} className={'group flex min-h-32 flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-ring ' + (selected ? 'border-brand bg-brand-50 shadow-card' : 'border-line bg-[#121a1b] hover:border-brand-200')}>
          {Icon && <Icon className={'mb-3 h-5 w-5 ' + (selected ? 'text-brand-700' : 'text-ink-muted')} aria-hidden="true" />}
          <span className="text-sm font-extrabold">{title}</span>
          {detail && <span className="mt-1 text-xs leading-5 text-ink-muted">{detail}</span>}
          {selected && <Check className="mt-auto ml-auto h-4 w-4 text-brand-700" aria-hidden="true" />}
        </button>;
      })}
    </div>
  );
}

export default function BusinessProfilePage() {
  const { businessProfile, saveBusinessProfile } = useData();
  const { toast } = useToast();
  const { saveBusinessProfile: saveSecureBusinessProfile, businessProfile: securedProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...(securedProfile || businessProfile || {}) }));
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleChannel = (id) => update('recordChannels', form.recordChannels.includes(id)
    ? form.recordChannels.filter((channel) => channel !== id)
    : [...form.recordChannels, id]);

  function next() {
    if (step === 0 && !form.displayName.trim()) return toast('Tell us what to call you before continuing.', { tone: 'warning' });
    if (step === 1 && !form.businessName.trim()) return toast('Add your business or trading name to continue.', { tone: 'warning' });
    if (step === 2 && !form.recordChannels.length) return toast('Choose at least one way you handle records.', { tone: 'warning' });
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function finish() {
    setSaving(true);
    try {
      const cleanProfile = saveBusinessProfile(form);
      await saveSecureBusinessProfile(cleanProfile);
      toast('Your profile is saved securely. Your clean ledger is ready.', { title: 'You are all set' });
      window.setTimeout(() => navigate('/app/dashboard'), 250);
    } catch (error) {
      toast(error.message || 'We could not save your profile. Check your connection and try again.', { tone: 'danger', title: 'Setup not saved' });
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">A better fit, from the first hello</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{step === 0 ? 'Let's get to know you' : step === 4 ? 'Your business, your way' : 'Let's get to know your business'}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">A few thoughtful steps help ZedBiz shape a workspace around the way you actually trade. This prototype keeps everything in this browser.</p>
      </header>

      <div className="mb-5 rounded-xl border border-line bg-[#101718] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-bold text-ink-muted">YOUR SETUP</span><span className="text-xs font-extrabold text-brand-700">Step {step + 1} of {STEPS.length} � {STEPS[step]}</span></div>
        <div className="grid grid-cols-5 gap-2" aria-label={'Step ' + (step + 1) + ' of ' + STEPS.length}>{STEPS.map((name, index) => <div key={name} className={'h-1.5 rounded-full transition-colors duration-300 ' + (index <= step ? 'bg-brand' : 'bg-line')} />)}</div>
        <div className="mt-2 hidden grid-cols-5 text-[10px] font-semibold text-ink-muted sm:grid">{STEPS.map((name) => <span key={name}>{name}</span>)}</div>
      </div>

      <Card className="overflow-hidden">
        <div key={step} className="profile-step-enter p-4 sm:p-7">
          {step === 0 && <section aria-labelledby="step-you">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Sparkles className="h-5 w-5" /></div><div><h2 id="step-you" className="text-lg font-extrabold">First, a little about you</h2><p className="mt-1 text-sm text-ink-muted">How should the workspace address you, and what do you do in the business?</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="What should we call you?" hint="A first name or nickname is enough.">{(props) => <Input {...props} autoFocus required maxLength={50} value={form.displayName} onChange={(event) => update('displayName', event.target.value)} placeholder="For example, Chanda" />}</Field>
              <Field label="Your role">{(props) => <Select {...props} value={form.role} onChange={(event) => update('role', event.target.value)}>{['Owner', 'Co-owner', 'Manager', 'Bookkeeper', 'Other'].map((role) => <option key={role}>{role}</option>)}</Select>}</Field>
            </div>
            <p className="mt-5 rounded-lg bg-surface px-4 py-3 text-xs leading-5 text-ink-muted">No NRC, TPIN, password, or banking details are collected in this profile setup.</p>
          </section>}

          {step === 1 && <section aria-labelledby="step-business">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Store className="h-5 w-5" /></div><div><h2 id="step-business" className="text-lg font-extrabold">Tell us what you do</h2><p className="mt-1 text-sm text-ink-muted">Your profile starts a separate, clean ledger. Sample businesses stay untouched.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business or trading name">{(props) => <Input {...props} autoFocus required maxLength={80} value={form.businessName} onChange={(event) => update('businessName', event.target.value)} placeholder="For example, Chisomo Market Stall" />}</Field>
              <Field label="Main type of business">{(props) => <Select {...props} value={form.businessType} onChange={(event) => update('businessType', event.target.value)}>{['Market trader', 'Retail shop', 'Food and hospitality', 'Salon or personal care', 'Professional services', 'Agriculture', 'Transport', 'Other'].map((type) => <option key={type}>{type}</option>)}</Select>}</Field>
            </div>
            <h3 className="mb-3 mt-6 text-sm font-extrabold">How is your business registered?</h3><ChoiceCards value={form.businessFormality} onChange={(value) => update('businessFormality', value)} items={FORMALITY} />
          </section>}

          {step === 2 && <section aria-labelledby="step-work">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><WalletCards className="h-5 w-5" /></div><div><h2 id="step-work" className="text-lg font-extrabold">How does your business run day to day?</h2><p className="mt-1 text-sm text-ink-muted">This helps shape examples and organize your records.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Province">{(props) => <Select {...props} value={form.province} onChange={(event) => update('province', event.target.value)}>{['Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'].map((province) => <option key={province}>{province}</option>)}</Select>}</Field>
              <Field label="Town, district, or market (optional)" hint="A broad location is enough.">{(props) => <Input {...props} maxLength={80} value={form.district} onChange={(event) => update('district', event.target.value)} placeholder="For example, Soweto Market" />}</Field>
              <Field label="Preferred language" hint="The current agent works with English notes.">{(props) => <Select {...props} value={form.language} onChange={(event) => update('language', event.target.value)}>{['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi', 'Other'].map((language) => <option key={language}>{language}</option>)}</Select>}</Field>
            </div>
            <h3 className="mb-3 mt-6 text-sm font-extrabold">How do customers pay or settle?</h3>
            <div className="grid gap-3 sm:grid-cols-3">{CHANNELS.map(({ id, label, detail, icon: Icon }) => { const selected = form.recordChannels.includes(id); return <button key={id} type="button" aria-pressed={selected} onClick={() => toggleChannel(id)} className={'flex min-h-28 flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-ring ' + (selected ? 'border-brand bg-brand-50' : 'border-line bg-[#121a1b] hover:border-brand-200')}><Icon className={'mb-2 h-5 w-5 ' + (selected ? 'text-brand-700' : 'text-ink-muted')} /><span className="text-sm font-extrabold">{label}</span><span className="mt-1 text-xs leading-5 text-ink-muted">{detail}</span></button>; })}</div>
          </section>}

          {step === 3 && <section aria-labelledby="step-registration">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="h-5 w-5" /></div><div><h2 id="step-registration" className="text-lg font-extrabold">Your registration journey</h2><p className="mt-1 text-sm text-ink-muted">This is self-reported readiness, not a ZRA eligibility decision.</p></div></div>
            {form.businessFormality === 'informal' ? <div><p className="mb-4 text-sm leading-6 text-ink-muted">Many businesses begin informally. Would guidance on formalising be useful later?</p><ChoiceCards value={form.formalizationInterest} onChange={(value) => update('formalizationInterest', value)} items={[{ id: 'yes', title: 'Yes, guide me' }, { id: 'unsure', title: 'I'm exploring' }, { id: 'no', title: 'Not right now' }]} /></div> : <div className="space-y-5"><p className="text-sm leading-6 text-ink-muted">Share only whether these apply. Do not enter registration or tax numbers.</p>{[['pacraStatus', 'Registered with PACRA?'], ['zraStatus', 'Have a ZRA TPIN?'], ['vatStatus', 'Registered for VAT?']].map(([key, label]) => <fieldset key={key}><legend className="mb-2 text-sm font-bold">{label}</legend><div className="flex flex-wrap gap-2">{[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'Not yet' }, { id: 'unsure', label: 'Not sure' }].map((choice) => <button key={choice.id} type="button" aria-pressed={form[key] === choice.id} onClick={() => update(key, choice.id)} className={'rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-ring ' + (form[key] === choice.id ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-[#121a1b] text-ink-muted hover:border-brand-200')}>{choice.label}</button>)}</div></fieldset>)}</div>}
            <Notification tone="info" title="Your answers are not checked against government records" className="mt-6">They help organize the experience only. Confirm status and obligations with Finance or ZRA before acting on them.</Notification>
          </section>}

          {step === 4 && <section aria-labelledby="step-review">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Check className="h-5 w-5" /></div><div><h2 id="step-review" className="text-lg font-extrabold">A workspace made for {form.businessName}</h2><p className="mt-1 text-sm text-ink-muted">Check your details. You can update this profile at any time.</p></div></div>
            <dl className="divide-y divide-line rounded-xl border border-line bg-[#101718] px-4">{[['Your name and role', form.displayName + ' � ' + form.role], ['Business', form.businessName + ' � ' + form.businessType], ['Registration journey', form.businessFormality === 'informal' ? 'Informal / not registered' : form.businessFormality === 'registered' ? 'Formally registered' : 'Working towards registration'], ['Location', [form.district, form.province].filter(Boolean).join(', ')], ['Records', form.recordChannels.map((channel) => CHANNELS.find((item) => item.id === channel)?.label).filter(Boolean).join(', ')], ['Language preference', form.language]].map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="text-xs font-semibold text-ink-muted">{label}</dt><dd className="text-sm font-bold">{value}</dd></div>)}</dl>
            <p className="mt-4 text-xs leading-5 text-ink-muted">Your own ledger begins empty. Add and confirm your first records after setup. Sample businesses remain available from the business switcher.</p>
          </section>}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-[#0e1516] px-4 py-4 sm:px-7">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</Button>
          {step < STEPS.length - 1 ? <Button icon={ArrowRight} onClick={next}>Continue</Button> : <Button icon={Check} loading={saving} onClick={finish}>Create my workspace</Button>}
        </div>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-ink-muted"><MapPin className="h-4 w-4 shrink-0" /> Your answers are saved to your team account and used to personalize your workspace.</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted"><CircleHelp className="h-4 w-4 shrink-0" /> We only ask for business context. Do not enter TPINs, passwords, or payment account numbers here.</p>
    </div>
  );
}

