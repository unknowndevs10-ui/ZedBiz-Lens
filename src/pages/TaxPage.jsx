import { useMemo, useState } from 'react';
import { ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card, { CardHeader } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { Field, Select } from '../components/common/FormControls';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateTaxReadiness } from '../services/taxEngine';
import { formatKwacha } from '../utils/format';

const DEFAULT_FORM = { legalForm: '', taxActivity: '', vatStatus: 'unsure', vatRegistrationType: 'unsure' };

export default function TaxPage() {
  const { businessId, business, businessProfile, transactions, saveBusinessProfile } = useData();
  const { saveBusinessProfile: saveSecureBusinessProfile } = useAuth();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taxForm, setTaxForm] = useState(() => ({ ...DEFAULT_FORM, ...(businessProfile || {}) }));
  const data = useMemo(() => calculateTaxReadiness(transactions, businessProfile || {}), [transactions, businessProfile, businessId]);
  const profileIncomplete = !businessProfile?.legalForm || !businessProfile?.taxActivity || !['yes', 'no'].includes(businessProfile?.vatStatus) || (businessProfile?.vatStatus === 'yes' && !['voluntary', 'statutory'].includes(businessProfile?.vatRegistrationType));

  async function saveTaxProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const clean = saveBusinessProfile({ ...(businessProfile || {}), ...taxForm });
      await saveSecureBusinessProfile(clean, { completed: true });
      setProfileOpen(false);
      toast('Your tax profile is saved. The estimates have been refreshed.', { title: 'Tax profile updated' });
    } catch (error) {
      toast(error.message || 'Could not save your tax profile.', { tone: 'danger', title: 'Profile not saved' });
    } finally { setSaving(false); }
  }

  function openProfile() {
    setTaxForm({ ...DEFAULT_FORM, ...(businessProfile || {}) });
    setProfileOpen(true);
  }

  function printBrief() {
    window.setTimeout(() => window.print(), 80);
  }

  return <main className="tax-dark -m-4 min-h-full p-4 sm:-m-6 sm:p-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow">TAX READINESS · {data.taxYear}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Tax readiness</h1><p className="mt-1 text-sm text-ink-muted">A clear, reviewable view from confirmed records for {business?.name || businessProfile?.businessName || 'your business'}.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" icon={ShieldCheck} onClick={openProfile}>Tax profile</Button><Button icon={FileText} onClick={printBrief}>Generate Tax Conversation Brief</Button></div>
      </header>

      <div className="mt-5 rounded-lg border border-amber-700/40 bg-[#201b12] px-4 py-3 text-sm leading-6 text-amber-100">
        <div className="flex items-start gap-3"><Badge tone="amber">Illustrative estimates</Badge><p>{data.disclaimer} Reference rates and assumptions are configurable and need Finance approval before production use.</p></div>
        <p className="mt-2 text-xs text-amber-100/70">Rule reference: {data.taxYear} · confirmed records only · {data.basis.days}-day annualization. <a className="font-bold underline" href={data.sourceUrl} target="_blank" rel="noreferrer">ZRA tax information <ArrowUpRight className="inline h-3 w-3" /></a></p>
      </div>

      <section className="mt-5 grid gap-4 xl:grid-cols-3" aria-label="Tax estimates">
        <Card className="tax-card border-[#34403f]">
          <CardHeader title="Turnover tax" description="Gross turnover scenarios; expenses do not reduce this base." action={<Badge tone={data.turnover.eligibility.status === 'illustrative-eligible' ? 'success' : 'amber'}>{data.turnover.eligibility.status === 'illustrative-eligible' ? 'Eligibility appears plausible' : 'Eligibility review'}</Badge>} />
          <div className="space-y-4 p-4 pt-3 sm:p-5 sm:pt-3">
            <div className="grid grid-cols-2 gap-3"><Metric label="Annualized turnover" value={formatKwacha(data.turnover.annualized)} /><Metric label="Reference ceiling" value={formatKwacha(data.turnover.ceiling)} /></div>
            <div className="grid gap-2 sm:grid-cols-2"><Scenario label="Excess over K30,000 floor" value={data.turnover.excessOnly} hint="5% above annual floor" /><Scenario label="5% of full turnover" value={data.turnover.fullTurnover} hint="Alternative comparison" /></div>
            {data.turnover.eligibility.reasons.length > 0 && <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-ink-muted">{data.turnover.eligibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
            {businessProfile?.vatStatus === 'yes' && businessProfile?.vatRegistrationType === 'voluntary' && <p className="text-xs leading-5 text-ink-muted">ZRA guidance allows voluntary VAT registration to coexist with turnover tax, subject to eligibility and the applicable return obligations.</p>}
            <p className="border-t border-white/10 pt-3 text-[11px] text-ink-muted">5% rate · first K30,000 annual turnover at 0% in the excess-only scenario. Both bases are shown for Finance review.</p>
          </div>
        </Card>

        <Card className="tax-card border-[#34403f]">
          <CardHeader title="VAT threshold & payable" description="Standard-rated sales and qualified Smart Invoice inputs." action={<Badge tone={data.vat.triggered ? 'amber' : 'success'}>{data.vat.triggered ? 'Threshold reached' : 'Threshold tracking'}</Badge>} />
          <div className="space-y-4 p-4 pt-3 sm:p-5 sm:pt-3">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-ink-muted">Annualized standard-rated sales</p><p className="mt-1 text-xl font-extrabold tabular-nums">{formatKwacha(data.vat.annualizedStandardRated)}</p></div><p className="text-right text-sm font-bold tabular-nums">{data.vat.actualProgressPercent.toFixed(1)}%<span className="block text-[10px] font-medium text-ink-muted">of {formatKwacha(data.vat.threshold)}</span></p></div>
            <div className="relative h-2.5 overflow-visible rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.min(100, data.vat.actualProgressPercent)} aria-valuemin="0" aria-valuemax="100" aria-label="VAT threshold progress"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, data.vat.actualProgressPercent)}%` }} /><span className="absolute -top-1 h-4 w-px bg-accent" style={{ left: '100%' }} /></div>
            <div className="flex justify-between text-[10px] text-ink-muted"><span>K0</span><span>Annual marker K800,000 · quarterly K200,000</span></div>
            <div className="grid grid-cols-2 gap-3"><Metric label="Qualifying Smart Invoice inputs" value={`${data.vat.inputInvoiceCount} invoice${data.vat.inputInvoiceCount === 1 ? '' : 's'}`} /><Metric label="Input VAT recorded" value={formatKwacha(data.vat.inputVat)} /></div>
            {data.vat.shouldEstimate ? <div className="rounded-md border border-white/10 bg-black/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{data.vat.registered ? 'Illustrative VAT payable for recorded period' : 'Illustrative registration exposure · not payable yet'}</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{formatKwacha(data.vat.vatPayableIllustration)}</p><p className="mt-1 text-[10px] text-ink-muted">Output {formatKwacha(data.vat.outputVat)} less qualified input {formatKwacha(data.vat.inputVat)}.</p></div> : <p className="rounded-md border border-white/10 bg-black/20 p-3 text-xs leading-5 text-ink-muted">Threshold tracking only. VAT is not estimated because the business is not marked registered and standard-rated turnover is below the marker.</p>}
            <p className="text-[11px] leading-5 text-ink-muted">{data.vat.note} Recorded standard-rated sales in this 90-day window: {formatKwacha(data.vat.periodStandardRated)}. Input VAT requires a Smart Invoice, verified supplier TPIN flag and invoice age within 90 days. VAT status and supply treatment require human confirmation.</p>
          </div>
        </Card>

        <Card className="tax-card border-[#34403f]">
          <CardHeader title="Income tax" description="Alternative income-tax scenario; the applicable regime needs human confirmation." action={<Badge tone="amber">Illustrative estimate</Badge>} />
          <div className="space-y-4 p-4 pt-3 sm:p-5 sm:pt-3">
            {profileIncomplete ? <div className="rounded-md border border-accent/30 bg-accent/10 p-4"><p className="text-sm font-bold">Complete your 30-second tax profile to unlock this estimate.</p><p className="mt-1 text-xs leading-5 text-ink-muted">Choose legal form, business activity and VAT status. The calculator will refresh as soon as you save.</p><Button className="mt-3" variant="secondary" onClick={openProfile}>Complete 30-sec Tax Profile to Unlock</Button></div> : <>
              <div className="grid grid-cols-2 gap-3"><Metric label="Annualized taxable profit" value={formatKwacha(data.incomeTax.annualizedTaxableProfit)} /><Metric label="Schedule" value={data.incomeTax.rateLabel} /></div>
              <div className="rounded-md border border-white/10 bg-black/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Illustrative annual income tax</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{data.incomeTax.estimatedTax == null ? 'Needs review' : formatKwacha(data.incomeTax.estimatedTax)}</p>{data.incomeTax.minimumAlternativeTax != null && <p className="mt-1 text-[10px] text-ink-muted">1% turnover floor check: {formatKwacha(data.incomeTax.minimumAlternativeTax)}. MAT crediting and final liability need accountant review.</p>}{data.incomeTax.estimatedTax == null && <p className="mt-1 text-[10px] leading-5 text-ink-muted">Partnership profit allocation is not captured. Ask Finance to establish each partner’s taxable share.</p>}</div>
              <div className="flex justify-between gap-3 border-t border-white/10 pt-3 text-xs"><span className="text-ink-muted">COGS + allowable operating deductions</span><strong className="tabular-nums">{formatKwacha(data.incomeTax.deductibleExpenses)}</strong></div>
              {data.incomeTax.unreviewedExpenseCount > 0 && <p className="text-[11px] leading-5 text-accent">{data.incomeTax.unreviewedExpenseCount} operating expense record(s) are not marked allowable, so they are excluded from the taxable-profit estimate.</p>}
            </>}
          </div>
        </Card>
      </section>

      <Card className="tax-card mt-5 border-[#34403f]">
        <CardHeader title="Confirmed-record accounting summary" description={`Last ${data.basis.days} days · ${data.basis.transactionCount} confirmed records`} />
        <dl className="mt-4 grid grid-cols-2 gap-px border-t border-line bg-line p-px sm:grid-cols-5">
          <SummaryMetric label="Total sales" amount={data.accounting.totalSales} /><SummaryMetric label="COGS" amount={data.accounting.cogs} /><SummaryMetric label="Allowable operating expenses" amount={data.accounting.allowableOperatingExpenses} /><SummaryMetric label="Gross profit" amount={data.accounting.grossProfit} /><SummaryMetric label="Net profit" amount={data.accounting.netProfit} />
        </dl>
        <p className="px-4 py-3 text-[11px] leading-5 text-ink-muted">Owner personal withdrawals are excluded from business expenses and deductions ({data.accounting.ownerWithdrawalsExcluded} excluded). Net profit is a management figure. It is not taxable profit.</p>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-ink-muted"><p>ZedBiz Lens does not file returns or connect to ZRA systems. Get professional review before acting on estimates.</p><Link to="/scope" className="font-bold text-brand-500 underline">Review system scope and limits</Link></div>

      <section className="tax-brief" aria-label="Printable tax conversation brief">
        <h1>ZedBiz Lens · Tax Conversation Brief</h1><p>{business?.name || businessProfile?.businessName || 'Business'} · {data.taxYear} · Prepared {data.basis.end}</p>
        <h2>Confirmed-record accounting · last {data.basis.days} days</h2><p>Sales: {formatKwacha(data.accounting.totalSales)} · COGS: {formatKwacha(data.accounting.cogs)} · Allowable operating expenses: {formatKwacha(data.accounting.allowableOperatingExpenses)} · Gross profit: {formatKwacha(data.accounting.grossProfit)} · Net profit: {formatKwacha(data.accounting.netProfit)}</p>
        <h2>Tax-readiness markers</h2><p>Annualized turnover: {formatKwacha(data.turnover.annualized)} · Turnover tax comparison: excess-over-floor {formatKwacha(data.turnover.excessOnly)}; full-turnover {formatKwacha(data.turnover.fullTurnover)} · VAT marker: {data.vat.actualProgressPercent.toFixed(1)}% of K800,000 · Output VAT: {formatKwacha(data.vat.outputVat)} · Qualified Smart Invoice input VAT: {formatKwacha(data.vat.inputVat)} across {data.vat.inputInvoiceCount} invoice(s) · Income-tax estimate: {data.incomeTax.estimatedTax == null ? 'profile incomplete' : formatKwacha(data.incomeTax.estimatedTax)}</p>
        <p>{data.disclaimer} This brief is for discussion with ZRA or an accountant. ZedBiz Lens does not file returns or connect to ZRA systems.</p>
      </section>

      <Modal open={profileOpen} onClose={saving ? undefined : () => setProfileOpen(false)} title="Complete your tax profile" description="Three short answers unlock the profile-specific estimate. VAT registration route is a follow-up if you select registered." footer={<><Button variant="secondary" onClick={() => setProfileOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="tax-profile-form" loading={saving}>Save and recalculate</Button></>}>
        <form id="tax-profile-form" onSubmit={saveTaxProfile} className="space-y-4">
          <Field label="Legal form">{(props) => <Select {...props} required value={taxForm.legalForm} onChange={(event) => setTaxForm((current) => ({ ...current, legalForm: event.target.value }))}><option value="">Choose legal form</option><option value="sole_trader">Sole trader</option><option value="registered_business_name">Registered business name</option><option value="limited_company">Limited company</option><option value="partnership">Partnership</option></Select>}</Field>
          <Field label="Main tax activity">{(props) => <Select {...props} required value={taxForm.taxActivity} onChange={(event) => setTaxForm((current) => ({ ...current, taxActivity: event.target.value }))}><option value="">Choose activity</option><option value="retail_trading">Retail / trading</option><option value="agriculture">Agriculture</option><option value="services">Services</option><option value="consultancy">Consultancy</option><option value="other">Other business</option></Select>}</Field>
          <Field label="VAT registration status">{(props) => <Select {...props} required value={taxForm.vatStatus} onChange={(event) => setTaxForm((current) => ({ ...current, vatStatus: event.target.value, vatRegistrationType: event.target.value === 'yes' ? current.vatRegistrationType : 'unsure' }))}><option value="unsure">Choose one</option><option value="yes">VAT registered</option><option value="no">Not VAT registered</option></Select>}</Field>
          {taxForm.vatStatus === 'yes' && <Field label="VAT registration route" hint="Voluntary VAT can coexist with turnover tax under current ZRA guidance; statutory registration needs tax-type review.">{(props) => <Select {...props} required value={taxForm.vatRegistrationType} onChange={(event) => setTaxForm((current) => ({ ...current, vatRegistrationType: event.target.value }))}><option value="unsure">Needs review</option><option value="voluntary">Voluntary</option><option value="statutory">Statutory / threshold-based</option></Select>}</Field>}
          <p className="text-[11px] leading-5 text-ink-muted">This is a demonstration tax profile. Do not enter your TPIN here. Estimates use confirmed records and explicit classifications.</p>
        </form>
      </Modal>
    </div>
  </main>;
}

function Metric({ label, value }) { return <div className="min-w-0 rounded-md border border-white/10 bg-black/15 p-3"><p className="text-[10px] leading-4 text-ink-muted">{label}</p><p className="mt-1 truncate text-sm font-bold tabular-nums">{value}</p></div>; }
function Scenario({ label, value, hint }) { return <div className="rounded-md border border-white/10 bg-black/15 p-3"><p className="text-[10px] leading-4 text-ink-muted">{label}</p><p className="mt-1 text-lg font-extrabold tabular-nums">{formatKwacha(value)}</p><p className="text-[10px] text-ink-muted">Illustrative · {hint}</p></div>; }
function SummaryMetric({ label, amount }) { return <div className="bg-[#121a1b] p-3 sm:p-4"><dt className="text-[10px] leading-4 text-ink-muted">{label}</dt><dd className="mt-1 text-sm font-extrabold tabular-nums">{formatKwacha(amount)}</dd></div>; }
