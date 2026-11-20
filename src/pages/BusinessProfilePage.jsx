import { useState } from 'react';
import { Building2, Check, Languages, MapPin, WalletCards } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import Notification from '../components/common/Notification';
import { Field, Input, Select } from '../components/common/FormControls';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const CHANNELS = [
  { id: 'cash', label: 'Cash' },
  { id: 'mobile_money', label: 'Mobile money' },
  { id: 'credit', label: 'Customer credit' },
];

export default function BusinessProfilePage() {
  const { businessProfile, saveBusinessProfile } = useData();
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({
    businessName: businessProfile?.businessName || '',
    businessType: businessProfile?.businessType || 'Market trader',
    location: businessProfile?.location || '',
    language: businessProfile?.language || 'English',
    recordChannels: businessProfile?.recordChannels || ['cash'],
  }));
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleChannel = (id) => update('recordChannels', form.recordChannels.includes(id)
    ? form.recordChannels.filter((channel) => channel !== id)
    : [...form.recordChannels, id]);

  function save(event) {
    event.preventDefault();
    if (!form.businessName.trim()) return toast('Add your business name to save this profile.', { tone: 'warning' });
    if (!form.recordChannels.length) return toast('Choose at least one way you record money.', { tone: 'warning' });
    setSaving(true);
    saveBusinessProfile(form);
    toast('Your business profile is saved in this browser.', { title: 'Profile ready' });
    window.setTimeout(() => setSaving(false), 350);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">Personalize your workspace</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Let’s get to know your business</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">A few details help the assistant use examples that fit the way you trade. You can change this any time.</p>
      </header>

      <Notification tone="info" title="Private to this browser">
        This prototype saves the business profile and new entries on this device only. It does not create an account or send your details to Zamtel or ZRA. The assistant currently understands English notes only.
      </Notification>

      <form onSubmit={save} className="mt-5 space-y-5">
        <Card>
          <CardHeader title="Your business" description="This profile creates a clean ledger for your business. Sample records are kept separate." action={<Building2 className="h-5 w-5 text-brand" aria-hidden="true" />} />
          <div className="grid gap-4 p-4 pt-5 sm:grid-cols-2 sm:p-5">
            <Field label="Business or trading name" hint="Use the name you want to see in your workspace.">
              {(props) => <Input {...props} required maxLength={80} value={form.businessName} onChange={(event) => update('businessName', event.target.value)} placeholder="For example, Chisomo Market Stall" />}
            </Field>
            <Field label="What kind of business is it?">
              {(props) => <Select {...props} value={form.businessType} onChange={(event) => update('businessType', event.target.value)}>
                {['Market trader', 'Retail shop', 'Food and hospitality', 'Salon or personal care', 'Professional services', 'Agriculture', 'Transport', 'Other'].map((type) => <option key={type}>{type}</option>)}
              </Select>}
            </Field>
            <Field label="Town or market (optional)" hint="A town or market name is enough; skip street details.">
              {(props) => <Input {...props} maxLength={80} value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="For example, Lusaka" />}
            </Field>
            <Field label="Preferred language">
              {(props) => <Select {...props} value={form.language} onChange={(event) => update('language', event.target.value)}>
                {['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi', 'Other'].map((language) => <option key={language}>{language}</option>)}
              </Select>}
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="How money moves in your business" description="Pick every way you commonly receive or record money." action={<WalletCards className="h-5 w-5 text-brand" aria-hidden="true" />} />
          <div className="grid gap-2 p-4 pt-5 sm:grid-cols-3 sm:p-5">
            {CHANNELS.map(({ id, label }) => {
              const checked = form.recordChannels.includes(id);
              return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${checked ? 'border-brand bg-brand-50' : 'border-line bg-[#121a1b] hover:border-brand-200'}`}>
                <input type="checkbox" className="h-4 w-4 accent-brand" checked={checked} onChange={() => toggleChannel(id)} />
                <span className="flex-1 text-sm font-semibold">{label}</span>
                {checked && <Check className="h-4 w-4 text-brand-700" aria-hidden="true" />}
              </label>;
            })}
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs text-ink-muted"><MapPin className="h-4 w-4" /><Languages className="h-4 w-4" /> Your details stay editable and local.</p>
          <Button type="submit" icon={Check} loading={saving}>Save business profile</Button>
        </div>
      </form>
    </div>
  );
}
