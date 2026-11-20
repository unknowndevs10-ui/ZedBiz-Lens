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
      });
      setErrors({});
      setSubmitError('');
    }
  }, [transaction]);

  if (!transaction || !form) return null;
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function changeType(type) {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
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
            {[['income', 'Income'], ['expense', 'Expense']].map(([value, label]) => (
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

        {form.type === 'income' && (
          <Field label="Tax label" hint="Demo label only. You decide, and Finance rules will replace it.">
            {(a) => (
              <Select {...a} value={form.taxable} onChange={(e) => set('taxable', e.target.value)}>
                {TAX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </Field>
        )}

        <Field label="Date" error={errors.date}>
          {(a) => <Input {...a} type="date" max={todayISO()} value={form.date} onChange={(e) => set('date', e.target.value)} />}
        </Field>

        {submitError && <p role="alert" className="text-[13px] font-medium text-danger">{submitError}</p>}
      </form>
    </Modal>
  );
}
