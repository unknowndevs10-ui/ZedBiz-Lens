import { useState } from 'react';
import { ArrowLeft, Check, Contrast, Eye, LayoutDashboard, Moon, Palette, Sun, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { readWorkspacePreferences, saveWorkspacePreferences } from '../services/workspacePreferences';

const THEMES = [
  { id: 'light', label: 'Mist', detail: 'Whitesmoke canvas · teal and amber accents', icon: Sun, sample: 'bg-[#F4F6F4]' },
  { id: 'dark', label: 'Night', detail: 'Deep charcoal · soft teal highlights', icon: Moon, sample: 'bg-[#172220]' },
];

function PreferenceButton({ active, onClick, children }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-ring ${active ? 'border-brand bg-brand-50 text-brand-800' : 'border-line bg-white text-ink hover:border-brand-200'}`}>{children}{active && <Check className="h-4 w-4 shrink-0" />}</button>;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(readWorkspacePreferences);
  function update(key, value) {
    setPreferences((current) => saveWorkspacePreferences({ ...current, [key]: value }));
  }

  return <main className="mx-auto max-w-5xl px-1 py-4 sm:px-3 sm:py-8">
    <header className="mb-6 flex items-start justify-between gap-4"><div><p className="eyebrow">WORKSPACE SETTINGS</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Make ZedBiz feel right for you.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Choose a comfortable color theme, information density and motion level. Your preferences stay on this device and apply across the workspace.</p></div><Link to="/app/profile" className="hidden shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-muted hover:border-brand-200 sm:inline-flex"><ArrowLeft className="h-4 w-4" />Account & business</Link></header>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,.7fr)]">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Palette className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">Color theme</h2><p className="mt-1 text-xs text-ink-muted">Mist is the default ZedBiz palette.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{THEMES.map(({ id, label, detail, icon: Icon, sample }) => <PreferenceButton key={id} active={preferences.theme === id} onClick={() => update('theme', id)}><span className="flex min-w-0 items-center gap-3"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line ${sample}`}><Icon className={`h-5 w-5 ${id === 'dark' ? 'text-[#91C9C0]' : 'text-brand-700'}`} /></span><span><span className="block text-sm font-extrabold">{label}</span><span className="mt-1 block text-[11px] leading-4 text-ink-muted">{detail}</span></span></span></PreferenceButton>)}</div></section>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><LayoutDashboard className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">Information density</h2><p className="mt-1 text-xs text-ink-muted">Adjust the breathing room in cards.</p></div></div><div className="grid gap-2"><PreferenceButton active={preferences.density === 'comfortable'} onClick={() => update('density', 'comfortable')}><span><span className="block text-sm font-bold">Comfortable</span><span className="mt-1 block text-[11px] text-ink-muted">More space between sections</span></span></PreferenceButton><PreferenceButton active={preferences.density === 'compact'} onClick={() => update('density', 'compact')}><span><span className="block text-sm font-bold">Compact</span><span className="mt-1 block text-[11px] text-ink-muted">Tighter cards and spacing</span></span></PreferenceButton></div></section>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><WandSparkles className="h-4 w-4" /></span><div><h2 className="text-sm font-extrabold">Motion</h2><p className="mt-1 text-xs text-ink-muted">Keep transitions calm or reduce them further.</p></div></div><div className="grid gap-2"><PreferenceButton active={preferences.motion === 'full'} onClick={() => update('motion', 'full')}><span><span className="block text-sm font-bold">Calm transitions</span><span className="mt-1 block text-[11px] text-ink-muted">Subtle movement during navigation</span></span></PreferenceButton><PreferenceButton active={preferences.motion === 'reduced'} onClick={() => update('motion', 'reduced')}><span className="block"><span className="text-sm font-bold">Reduce motion</span><span className="mt-1 block text-[11px] text-ink-muted">Limit animation and movement</span></span></PreferenceButton></div></section>
      <aside className="rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6"><div className="flex items-center gap-2 text-brand-800"><Eye className="h-4 w-4" /><h2 className="text-sm font-extrabold">Private preferences</h2></div><p className="mt-3 text-xs leading-5 text-ink-muted">These display choices are saved in this browser only. They do not change your business profile, ledger, tax calculations or AI context.</p><p className="mt-3 text-[11px] leading-5 text-ink-muted">The current light theme keeps the whitesmoke, teal and amber identity. Night mode is optional and can be changed at any time.</p><Button to="/app/profile" variant="secondary" className="mt-5 w-full" icon={ArrowLeft}>Back to Account & business</Button></aside>
    </div>
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs leading-5 text-ink-muted"><Contrast className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><p>For accessibility, your operating system’s reduced-motion preference is also respected.</p></div>
  </main>;
}
