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

const STEPS = ['You', 'Business', 'How you work', 'Goals', 'Registration', 'Review'];
const GOALS = [
  { id: 'records', title: 'Keep better records', detail: 'Know what was sold, spent and still owed.', icon: WalletCards },
  { id: 'profit', title: 'Understand profit', detail: 'See which activity is paying off.', icon: BadgeCheck },
  { id: 'cashflow', title: 'Manage cash flow', detail: 'Plan for stock, fees and quiet days.', icon: CreditCard },
  { id: 'tax_ready', title: 'Prepare for tax', detail: 'Organize records before asking for advice.', icon: ShieldCheck },
  { id: 'growth', title: 'Grow the business', detail: 'Spot practical opportunities to improve.', icon: Sparkles },
];
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
  vatStatus: 'unsure', formalizationInterest: 'yes', goals: ['records', 'profit'],
  biggestChallenge: 'keeping_records', operatingDaysPerWeek: '6',
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
  const { saveBusinessProfile: saveSecureBusinessProfile, businessProfile: securedProfile, profileComplete, signOut } = useAuth();
  const navigate = useNavigate();
  const initialStep = Number.isInteger(securedProfile?.onboardingStep) ? Math.min(Math.max(securedProfile.onboardingStep, 0), STEPS.length - 1) : 0;
  const [step, setStep] = useState(initialStep);
  const [showIntro, setShowIntro] = useState(() => !profileComplete && !securedProfile);
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...(securedProfile || businessProfile || {}) }));
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleChannel = (id) => update('recordChannels', form.recordChannels.includes(id)
    ? form.recordChannels.filter((channel) => channel !== id)
    : [...form.recordChannels, id]);
  const toggleGoal = (id) => update('goals', form.goals.includes(id)
    ? form.goals.filter((goal) => goal !== id)
    : [...form.goals, id]);

  async function next() {
    if (step === 0 && !form.displayName.trim()) return toast('Tell us what to call you before continuing.', { tone: 'warning' });
    if (step === 1 && !form.businessName.trim()) return toast('Add your business or trading name to continue.', { tone: 'warning' });
    if (step === 2 && !form.recordChannels.length) return toast('Choose at least one way you handle records.', { tone: 'warning' });
    if (step === 3 && !form.goals.length) return toast('Choose one goal so ZedBiz can shape your guidance.', { tone: 'warning' });
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    setSaving(true);
    try {
      const cleanProfile = saveBusinessProfile({ ...form, onboardingStep: nextStep });
      await saveSecureBusinessProfile(cleanProfile, { completed: profileComplete, onboardingStep: nextStep });
      setStep(nextStep);
    } catch (error) {
      toast(error.message || 'We could not save this step. Check your connection and try again.', { tone: 'danger', title: 'Progress not saved' });
    } finally {
      setSaving(false);
    }
  }

  async function saveAndSignOut() {
    setSaving(true);
    try {
      const cleanProfile = saveBusinessProfile(form);
      await saveSecureBusinessProfile(cleanProfile, { completed: false, onboardingStep: step });
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      toast(error.message || 'We could not save your progress. Check your connection and try again.', { tone: 'danger', title: 'Progress not saved' });
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      const cleanProfile = saveBusinessProfile(form);
      await saveSecureBusinessProfile(cleanProfile, { completed: true });
      toast('Your profile is saved securely. Your clean ledger is ready.', { title: 'You are all set' });
      window.setTimeout(() => navigate('/app/dashboard'), 250);
    } catch (error) {
      toast(error.message || 'We could not save your profile. Check your connection and try again.', { tone: 'danger', title: 'Setup not saved' });
      setSaving(false);
    }
  }

  if (showIntro) return (
    <div className="mx-auto max-w-3xl py-5 sm:py-10">
      <section aria-labelledby="business-intro-title" className="rounded-2xl border border-line bg-[#101718] p-5 shadow-card sm:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700"><Sparkles className="h-6 w-6" /></div>
          <p className="eyebrow mt-5">WELCOME TO YOUR ZEDBIZ WORKSPACE</p>
          <h1 id="business-intro-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Let's make your business easier to understand.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-muted">A few short questions will shape a workspace around the way you trade, the records you keep and what you want to improve.</p>
        </div>

        <div className="mx-auto mt-7 grid max-w-2xl gap-3">
          <article className="flex items-start gap-3 rounded-xl border border-line bg-[#141d1e] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><WalletCards className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">Built around your working day</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Tell us how customers pay, what kind of business you run and what is hardest to manage.</p></div></article>
          <article className="flex items-start gap-3 rounded-xl border border-line bg-[#141d1e] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><ShieldCheck className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">You stay in control</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Your entries remain drafts until you review and confirm them. Business signals explain the records behind each prompt.</p></div></article>
          <article className="flex items-start gap-3 rounded-xl border border-line bg-[#141d1e] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><Sparkles className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">Guidance that grows with your records</h2><p className="mt-1 text-xs leading-5 text-ink-muted">The pilot uses transparent rules to highlight patterns. It does not make decisions or determine your tax obligations.</p></div></article>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          <Button size="lg" icon={ArrowRight} onClick={() => setShowIntro(false)}>Let's go</Button>
          <p className="text-[11px] text-ink-muted">Six short steps � progress saves as you continue � you can sign out and resume</p>
        </div>
      </section>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">A better fit, from the first hello</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{profileComplete ? 'Your business profile' : step === 0 ? "Let's get to know you" : step === 5 ? 'Your business, your way' : "Let's get to know your business"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{profileComplete ? 'Review your business details and update them as your work changes.' : 'A few thoughtful steps help ZedBiz understand the way you trade, what matters to you and which patterns to watch. Your progress saves as you continue, so you can sign out and pick up here later.'}</p>
      </header>

      <div className="mb-5 rounded-xl border border-line bg-[#101718] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-bold text-ink-muted">YOUR SETUP</span><span className="text-xs font-extrabold text-brand-700">Step {step + 1} of {STEPS.length} � {STEPS[step]}</span></div>
        <div className="grid grid-cols-6 gap-2" role="progressbar" aria-label="Business setup progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>{STEPS.map((name, index) => <div key={name} aria-hidden="true" className={'h-1.5 rounded-full transition-colors duration-300 ' + (index <= step ? 'bg-brand' : 'bg-line')} />)}</div>
        <div className="mt-2 hidden grid-cols-6 text-[10px] font-semibold text-ink-muted sm:grid">{STEPS.map((name) => <span key={name}>{name}</span>)}</div>
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

          {step === 3 && <section aria-labelledby="step-goals">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Sparkles className="h-5 w-5" /></div><div><h2 id="step-goals" className="text-lg font-extrabold">What would make business easier?</h2><p className="mt-1 text-sm text-ink-muted">Choose the goals and everyday challenge you want ZedBiz to pay attention to first.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">{GOALS.map(({ id, title, detail, icon: Icon }) => { const selected = form.goals.includes(id); return <button key={id} type="button" aria-pressed={selected} onClick={() => toggleGoal(id)} className={'flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-ring ' + (selected ? 'border-brand bg-brand-50' : 'border-line bg-[#121a1b] hover:border-brand-200')}><Icon className={'mt-0.5 h-5 w-5 shrink-0 ' + (selected ? 'text-brand-700' : 'text-ink-muted')} /><span><span className="block text-sm font-extrabold">{title}</span><span className="mt-1 block text-xs leading-5 text-ink-muted">{detail}</span></span></button>; })}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="What is hardest to manage right now?">{(props) => <Select {...props} value={form.biggestChallenge} onChange={(event) => update('biggestChallenge', event.target.value)}><option value="keeping_records">Keeping daily records</option><option value="pricing">Setting prices and understanding profit</option><option value="stock">Planning stock or supplies</option><option value="cashflow">Managing cash flow</option><option value="customer_credit">Tracking customer credit</option><option value="tax">Understanding tax responsibilities</option><option value="growth">Finding room to grow</option></Select>}</Field><Field label="How many days do you usually trade each week?">{(props) => <Select {...props} value={form.operatingDaysPerWeek} onChange={(event) => update('operatingDaysPerWeek', event.target.value)}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={String(days)}>{days} {days === 1 ? 'day' : 'days'}</option>)}</Select>}</Field></div>
            <p className="mt-4 text-xs leading-5 text-ink-muted">These answers guide suggestions; the agent does not make decisions or change your records.</p>
          </section>}

          {step === 4 && <section aria-labelledby="step-registration">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="h-5 w-5" /></div><div><h2 id="step-registration" className="text-lg font-extrabold">Your registration journey</h2><p className="mt-1 text-sm text-ink-muted">This is self-reported readiness, not a ZRA eligibility decision.</p></div></div>
            {form.businessFormality === 'informal' ? <div><p className="mb-4 text-sm leading-6 text-ink-muted">Many businesses begin informally. Would guidance on formalising be useful later?</p><ChoiceCards value={form.formalizationInterest} onChange={(value) => update('formalizationInterest', value)} items={[{ id: 'yes', title: 'Yes, guide me' }, { id: 'unsure', title: 'I'm exploring' }, { id: 'no', title: 'Not right now' }]} /></div> : <div className="space-y-5"><p className="text-sm leading-6 text-ink-muted">Share only whether these apply. Do not enter registration or tax numbers.</p>{[['pacraStatus', 'Registered with PACRA?'], ['zraStatus', 'Have a ZRA TPIN?'], ['vatStatus', 'Registered for VAT?']].map(([key, label]) => <fieldset key={key}><legend className="mb-2 text-sm font-bold">{label}</legend><div className="flex flex-wrap gap-2">{[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'Not yet' }, { id: 'unsure', label: 'Not sure' }].map((choice) => <button key={choice.id} type="button" aria-pressed={form[key] === choice.id} onClick={() => update(key, choice.id)} className={'rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-ring ' + (form[key] === choice.id ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-[#121a1b] text-ink-muted hover:border-brand-200')}>{choice.label}</button>)}</div></fieldset>)}</div>}
            <Notification tone="info" title="Your answers are not checked against government records" className="mt-6">They help organize the experience only. Confirm status and obligations with Finance or ZRA before acting on them.</Notification>
          </section>}

          {step === 5 && <section aria-labelledby="step-review">
            <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Check className="h-5 w-5" /></div><div><h2 id="step-review" className="text-lg font-extrabold">A workspace made for {form.businessName}</h2><p className="mt-1 text-sm text-ink-muted">Check your details. You can update this profile at any time.</p></div></div>
            <dl className="divide-y divide-line rounded-xl border border-line bg-[#101718] px-4">{[['Your name and role', form.displayName + ' � ' + form.role], ['Business', form.businessName + ' � ' + form.businessType], ['Registration journey', form.businessFormality === 'informal' ? 'Informal / not registered' : form.businessFormality === 'registered' ? 'Formally registered' : 'Working towards registration'], ['Location', [form.district, form.province].filter(Boolean).join(', ')], ['Customer payments', form.recordChannels.map((channel) => CHANNELS.find((item) => item.id === channel)?.label).filter(Boolean).join(', ')], ['Your first goals', form.goals.map((goal) => GOALS.find((item) => item.id === goal)?.title).filter(Boolean).join(', ')], ['Language preference', form.language]].map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="text-xs font-semibold text-ink-muted">{label}</dt><dd className="text-sm font-bold">{value}</dd></div>)}</dl>
            <p className="mt-4 text-xs leading-5 text-ink-muted">Your ledger begins empty. After setup, your own entries will power the dashboard, calculator and business guidance.</p>
          </section>}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-[#0e1516] px-4 py-4 sm:px-7">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving}>Back</Button>
          <div className="flex flex-wrap justify-end gap-2">
            {!profileComplete && <Button variant="secondary" onClick={saveAndSignOut} loading={saving}>Save and sign out</Button>}
            {step < STEPS.length - 1 ? <Button icon={ArrowRight} onClick={next} loading={saving}>Continue</Button> : <Button icon={Check} loading={saving} onClick={finish}>{profileComplete ? 'Save profile' : 'Create my workspace'}</Button>}
          </div>
        </div>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-ink-muted"><MapPin className="h-4 w-4 shrink-0" /> Your answers are saved to your team account and used to personalize your workspace.</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted"><CircleHelp className="h-4 w-4 shrink-0" /> We only ask for business context. Do not enter TPINs, passwords, or payment account numbers here.</p>
    </div>
  );
}

