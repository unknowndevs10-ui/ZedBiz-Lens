import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Field, Input, Select } from '../common/FormControls';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/mockData';
import { todayISO } from '../../utils/format';
import { TAX_OPTIONS } from './TaxLabel';

export default function EditTransactionModal({ transaction, onClose, onSave }) {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        amount: String(transaction.amount),
        date: transaction.date,
        taxable: transaction.taxable || 'taxable',
        vatTreatment: transaction.vatTreatment || 'unsure',
        amountIncludesVat: transaction.amountIncludesVat !== false,
        taxDeductible: typeof transaction.taxDeductible === 'boolean' ? String(transaction.taxDeductible) : 'unsure',
        smartInvoiceValid: Boolean(transaction.smartInvoiceValid),
        supplierTpinVerified: Boolean(transaction.supplierTpinVerified),
        inputVatAmount: transaction.inputVatAmount == null ? '' : String(transaction.inputVatAmount),
        inputInvoiceDate: transaction.inputInvoiceDate || transaction.date,
      });
      setErrors({});
      setSubmitError('');
    }
  }, [transaction]);

  if (!transaction || !form) return null;
  const categories = form.type === 'income' ? INCOME_CATEGORIES : form.type === 'owner_withdrawal' ? ['Owner personal withdrawal'] : EXPENSE_CATEGORIES;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function changeType(type) {
    const list = type === 'income' ? INCOME_CATEGORIES : type === 'owner_withdrawal' ? ['Owner personal withdrawal'] : EXPENSE_CATEGORIES;
    setForm((f) => ({ ...f, type, category: list.includes(f.category) ? f.category : list[0] }));
  }

  function validate() {
    const next = {};
    if (!form.description.trim()) next.description = 'Add a short description.';
    if (!(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than zero.';
    if (!form.date) next.date = 'Choose a date.';
    else if (form.date > todayISO()) next.date = 'The date cannot be in the future.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError('');
    try {
      const patch = { ...form, description: form.description.trim(), amount: Number(form.amount) };
      if (form.type !== 'income') patch.taxable = null;
      patch.taxDeductible = form.type === 'expense' ? (form.taxDeductible === 'true' ? true : form.taxDeductible === 'false' ? false : null) : null;
      patch.amountIncludesVat = form.type === 'income' ? form.amountIncludesVat : null;
      patch.inputVatAmount = form.type === 'expense' ? (Number(form.inputVatAmount) > 0 ? Number(form.inputVatAmount) : null) : null;
      patch.smartInvoiceValid = form.type === 'expense' && Boolean(form.smartInvoiceValid);
      patch.supplierTpinVerified = form.type === 'expense' && Boolean(form.supplierTpinVerified);
      patch.vatTreatment = form.type === 'income' ? form.vatTreatment : null;
      await onSave(patch);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      title="Edit entry"
      description={transaction.status === 'pending' ? 'Fix anything that looks wrong, then confirm it from the review list.' : 'Changes update your dashboard straight away.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-transaction-form" loading={saving}>Save changes</Button>
        </>
      }
    >
      <form id="edit-transaction-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Description" error={errors.description}>
          {(a) => <Input {...a} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={120} />}
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Type</span>
          <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-md border border-line bg-surface p-1">
            {[['income', 'Income'], ['expense', 'Expense'], ['owner_withdrawal', 'Owner drawing']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.type === value}
                onClick={() => changeType(value)}
                className={`h-9 rounded text-sm font-semibold focus-ring ${form.type === value ? 'bg-[#121a1b] text-brand-700 shadow-card' : 'text-ink-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {(a) => (
              <Select {...a} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Amount (ZMW)" error={errors.amount}>
            {(a) => <Input {...a} type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} />}
          </Field>
        </div>

        {form.type !== 'owner_withdrawal' && <Field label="Payment channel">
          {(a) => <Select {...a} value={form.paymentMethod || transaction.paymentMethod || 'unspecified'} onChange={(e) => set('paymentMethod', e.target.value)}><option value="unspecified">Not recorded</option><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="credit">Customer credit</option></Select>}
        </Field>}

        <Field label="Client job (optional)" hint="For service work, use the same job name on related income and cost entries.">
          {(a) => <Input {...a} maxLength={80} value={form.jobName ?? transaction.jobName ?? ''} onChange={(e) => set('jobName', e.target.value)} placeholder="e.g. Mr Banda wiring job" />}
        </Field>

        {form.type === 'income' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Income tax label" hint="For turnover readiness; confirm the classification.">
              {(a) => <Select {...a} value={form.taxable} onChange={(e) => set('taxable', e.target.value)}>{TAX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
            </Field>
            <Field label="VAT supply type" hint="Only explicitly standard-rated sales count toward the VAT indicator.">
              {(a) => <Select {...a} value={form.vatTreatment} onChange={(e) => set('vatTreatment', e.target.value)}><option value="unsure">Not reviewed</option><option value="standard_rated">Standard-rated (16%)</option><option value="zero_rated">Zero-rated</option><option value="exempt">Exempt</option></Select>}
            </Field>
            <Field label="Is the amount VAT-inclusive?">
              {(a) => <Select {...a} value={String(form.amountIncludesVat)} onChange={(e) => set('amountIncludesVat', e.target.value === 'true')}><option value="true">Yes, total includes VAT</option><option value="false">No, amount is before VAT</option></Select>}
            </Field>
          </div>
        )}

        {form.type === 'expense' && <div className="space-y-3 rounded-lg border border-line p-3">
          <Field label="Tax deduction status" hint="Only amounts you explicitly mark allowable enter the income-tax estimate; ask Finance if unsure.">
            {(a) => <Select {...a} value={form.taxDeductible} onChange={(e) => set('taxDeductible', e.target.value)}><option value="unsure">Needs review</option><option value="true">Mark as allowable</option><option value="false">Not allowable</option></Select>}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Input VAT on invoice (ZMW)" hint="Enter the amount shown on the invoice.">
              {(a) => <Input {...a} type="number" min="0" step="0.01" value={form.inputVatAmount} onChange={(e) => set('inputVatAmount', e.target.value)} />}
            </Field>
            <Field label="Supplier invoice date">
              {(a) => <Input {...a} type="date" value={form.inputInvoiceDate} onChange={(e) => set('inputInvoiceDate', e.target.value)} />}
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.smartInvoiceValid} onChange={(e) => set('smartInvoiceValid', e.target.checked)} /> Valid ZRA Smart Invoice</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.supplierTpinVerified} onChange={(e) => set('supplierTpinVerified', e.target.checked)} /> Supplier TPIN checked</label>
          </div>
          <p className="text-[11px] leading-5 text-ink-muted">Input VAT counts only when both checks are selected and the invoice is within the 90-day validity window. No TPIN number is stored.</p>
        </div>}

        <Field label="Date" error={errors.date}>
          {(a) => <Input {...a} type="date" max={todayISO()} value={form.date} onChange={(e) => set('date', e.target.value)} />}
        </Field>

        {submitError && <p role="alert" className="text-[13px] font-medium text-danger">{submitError}</p>}
      </form>
    </Modal>
  );
}
