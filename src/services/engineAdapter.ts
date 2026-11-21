import { addDays, todayISO } from '../utils/format';

export type ReceiptExtraction = {
  supplier: string;
  date: string;
  line_items: Array<{ description: string; quantity: number; unit_price: number; amount: number }>;
  cogs_amount: number;
  expense_amount: number;
  total_zmw: number;
  confidence: number;
  smart_invoice_valid: boolean | null;
  supplier_tpin_verified: boolean | null;
  input_vat_amount: number | null;
  source: 'donut-live' | 'donut-simulated';
};

const engineUrl = String(import.meta.env.VITE_ENGINE_API_URL || '').replace(/\/$/, '');

function normalizeReceiptPayload(payload: any): ReceiptExtraction {
  if (!payload || typeof payload !== 'object') throw new Error('Receipt service returned an invalid response.');
  const line_items = Array.isArray(payload.line_items) ? payload.line_items.map((item: any) => {
    const quantity = Number(item.quantity) || 0;
    const unit_price = Number(item.unit_price) || 0;
    return {
      description: String(item.description || item.name || 'Unlabelled item'),
      quantity,
      unit_price,
      amount: Number(item.amount) || quantity * unit_price,
    };
  }) : [];
  const cogs_amount = Number(payload.cogs_amount ?? payload.cogs ?? 0);
  const expense_amount = Number(payload.expense_amount ?? payload.expenses ?? 0);
  const total_zmw = Number(payload.total_zmw ?? payload.total);
  const confidence = Number(payload.confidence);
  if (!Number.isFinite(total_zmw) || total_zmw <= 0 || !Number.isFinite(confidence)) {
    throw new Error('Receipt service must return a positive total and a confidence score.');
  }
  return {
    supplier: String(payload.supplier || 'Unknown supplier'),
    date: String(payload.date || todayISO()),
    line_items,
    cogs_amount: Number.isFinite(cogs_amount) ? cogs_amount : 0,
    expense_amount: Number.isFinite(expense_amount) ? expense_amount : 0,
    total_zmw,
    confidence: Math.min(1, Math.max(0, confidence)),
    smart_invoice_valid: typeof payload.smart_invoice_valid === 'boolean' ? payload.smart_invoice_valid : null,
    supplier_tpin_verified: typeof payload.supplier_tpin_verified === 'boolean' ? payload.supplier_tpin_verified : null,
    input_vat_amount: Number.isFinite(Number(payload.input_vat_amount)) ? Number(payload.input_vat_amount) : null,
    source: 'donut-live',
  };
}

export async function extractReceipt(file: File): Promise<ReceiptExtraction> {
  if (engineUrl) {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${engineUrl}/receipts/extract`, { method: 'POST', body });
    if (!response.ok) throw new Error(`Receipt service returned ${response.status}.`);
    return normalizeReceiptPayload(await response.json());
  }

  // Offline demonstration only. This sample is not inferred from image pixels.
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return {
    supplier: 'Demo Wholesale Market',
    date: todayISO(),
    line_items: [{ description: 'Produce and shop stock (sample)', quantity: 1, unit_price: 860, amount: 860 }],
    cogs_amount: 860,
    expense_amount: 60,
    total_zmw: 920,
    confidence: 0.72,
    smart_invoice_valid: null,
    supplier_tpin_verified: null,
    input_vat_amount: null,
    source: 'donut-simulated',
  };
}

export async function predictThirtyDayRevenue(history: Array<{ date: string; revenue: number }>, { profile = {} as any } = {}) {
  if (engineUrl) {
    const response = await fetch(`${engineUrl}/forecast/revenue`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history, horizon_days: 30, business_type: profile?.businessType || 'other' }),
    });
    if (!response.ok) throw new Error(`Forecast service returned ${response.status}.`);
    return response.json();
  }
  const cleaned = history.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(Number(row.revenue)) && Number(row.revenue) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  const observed = new Map();
  cleaned.forEach((row) => observed.set(row.date, (observed.get(row.date) || 0) + Number(row.revenue)));
  const dates = [...observed.keys()].sort();
  const spanDays = dates.length ? Math.max(1, Math.round((Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) / 86400000) + 1) : 0;
  const total = [...observed.values()].reduce((sum, value) => sum + value, 0);
  const dailyAverage = spanDays ? total / spanDays : 0;
  const predicted_revenue = Math.round(dailyAverage * 30 * 100) / 100;
  const uncertainty = spanDays >= 30 ? 0.25 : spanDays >= 14 ? 0.4 : 0.6;
  return {
    predicted_revenue,
    confidence_low: Math.round(predicted_revenue * (1 - uncertainty) * 100) / 100,
    confidence_high: Math.round(predicted_revenue * (1 + uncertainty) * 100) / 100,
    growth_driver: spanDays ? `Mean of confirmed sales across ${spanDays} observed calendar day${spanDays === 1 ? '' : 's'}` : 'Not enough confirmed sales history',
    history_days: spanDays,
    source: 'synthetic-baseline',
  };
}

export function receiptDraft(extraction: ReceiptExtraction) {
  return {
    type: 'expense', category: 'Stock purchases', description: extraction.supplier,
    amount: Number(extraction.total_zmw) || Number(extraction.cogs_amount) + Number(extraction.expense_amount),
    date: extraction.date || addDays(todayISO(), 0), confidence: extraction.confidence,
    source: extraction.source === 'donut-live' ? 'Donut OCR' : 'Simulated Donut sample',
  };
}

