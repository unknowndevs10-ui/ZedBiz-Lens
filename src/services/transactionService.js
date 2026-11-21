import api from './api';
import { config } from '../config';
import { setMockStorageScope } from './mockApi';

/**
 * Adapter between whatever the backend returns and the shape the UI uses.
 * Accepts both camelCase and snake_case so a FastAPI default does not break us.
 * Update this one function once the official response schema is agreed.
 */
export function normalizeTransaction(raw) {
  return {
    id: String(raw.id),
    businessId: raw.businessId ?? raw.business_id ?? null,
    status: raw.status ?? 'pending', // 'pending' | 'confirmed' | 'rejected'
    type: raw.type, // 'income' | 'expense'
    category: raw.category,
    description: raw.description,
    amount: Number(raw.amount),
    date: raw.date,
    confidence: raw.confidence ?? null, // 0..1 or null
    entryId: raw.entryId ?? raw.entry_id ?? null,
    source: raw.source ?? raw.original_text ?? null,
    paymentMethod: raw.paymentMethod ?? raw.payment_method ?? 'unspecified',
    reference: raw.reference ?? raw.transaction_reference ?? null,
    counterparty: raw.counterparty ?? raw.party ?? null,
    jobName: raw.jobName ?? raw.job_name ?? null,
    feeAmount: raw.feeAmount ?? raw.fee_amount ?? null,
    itemName: raw.itemName ?? raw.item_name ?? null,
    unitCost: raw.unitCost ?? raw.unit_cost ?? null,
    quantity: raw.quantity ?? null,
    vatTreatment: raw.vatTreatment ?? raw.vat_treatment ?? 'unsure',
    amountIncludesVat: raw.amountIncludesVat ?? raw.amount_includes_vat ?? true,
    taxDeductible: raw.taxDeductible ?? raw.tax_deductible ?? null,
    smartInvoiceValid: Boolean(raw.smartInvoiceValid ?? raw.smart_invoice_valid),
    supplierTpinVerified: Boolean(raw.supplierTpinVerified ?? raw.supplier_tpin_verified),
    inputVatAmount: raw.inputVatAmount ?? raw.input_vat_amount ?? null,
    inputInvoiceDate: raw.inputInvoiceDate ?? raw.input_invoice_date ?? null,
    createdBy: raw.createdBy ?? raw.created_by ?? null,
    approvedBy: raw.approvedBy ?? raw.approved_by ?? null,
    aiExplanation: raw.aiExplanation ?? raw.ai_explanation ?? null,
    aiSource: raw.aiSource ?? raw.ai_source ?? null,
    aiConfidence: raw.aiConfidence ?? raw.ai_confidence ?? null,
    taxable: raw.taxable ?? null, // 'taxable' | 'not_taxable' | 'unsure' | null (not classified)
    taxReason: raw.taxReason ?? raw.tax_reason ?? null,
    synthetic: Boolean(raw.synthetic),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}

export const transactionService = {
  setUserScope: (userId) => setMockStorageScope(userId),
  isSyntheticDemoActive: () => config.useMockData && typeof api.isSyntheticDemoActive === 'function' && api.isSyntheticDemoActive(),
  async enterSyntheticDemo(options) {
    if (!config.useMockData || typeof api.enterSyntheticDemo !== 'function') {
      throw new Error('Synthetic sample workspaces are not available in live-data mode.');
    }
    return api.enterSyntheticDemo(options);
  },
  async exitSyntheticDemo() {
    if (config.useMockData && typeof api.exitSyntheticDemo === 'function') await api.exitSyntheticDemo();
  },
  listBusinesses: () => api.listBusinesses(),

  async list(businessId) {
    const rows = await api.getTransactions({ businessId });
    return rows.map(normalizeTransaction);
  },

  /** Submit a free-text business entry; resolves with extracted, still-pending transactions. */
  async submitEntry({ businessId, text }) {
    const res = await api.submitEntry({ businessId, text });
    return { entryId: res.entryId ?? res.entry_id, text: res.text ?? text, transactions: (res.transactions || []).map(normalizeTransaction) };
  },

  async submitAgentDraft({ businessId, text, draft }) {
    if (!config.useMockData || typeof api.submitAgentDraft !== 'function') {
      throw new Error('Agent draft saving is only available in the synthetic demo workspace.');
    }
    const res = await api.submitAgentDraft({ businessId, text, draft });
    return { entryId: res.entryId ?? res.entry_id, text: res.text ?? text, transactions: (res.transactions || []).map(normalizeTransaction) };
  },

  async update(id, patch) {
    return normalizeTransaction(await api.updateTransaction(id, patch));
  },

  async confirm(id, patch) {
    return normalizeTransaction(await api.confirmTransaction(id, patch));
  },

  async reject(id) {
    return normalizeTransaction(await api.rejectTransaction(id));
  },

  resetDemo() {
    if (!config.useMockData) return Promise.reject(new Error('Resetting demo data is only available in mock mode.'));
    return api.resetDemoData();
  },
};

