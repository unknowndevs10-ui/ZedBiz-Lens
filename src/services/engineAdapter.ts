import { addDays, todayISO } from '../utils/format';
import { supabase } from '../lib/supabase';

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
  currency_code?: string | null;
  source: 'donut-live' | 'veryfi-live' | 'manual-entry';
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
    currency_code: typeof payload.currency_code === 'string' ? payload.currency_code.toUpperCase() : null,
    source: payload.source === 'veryfi-live' ? 'veryfi-live' : 'donut-live',
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

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('Sign in to use receipt reading.');
    const { fileData, mimeType } = await compressReceiptImage(file);
    const response = await fetch('/api/receipts/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ file_name: file.name, mime_type: mimeType, file_data: fileData }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Receipt service returned ${response.status}.`);
    return normalizeReceiptPayload(payload);
  }

  // Without a configured vision endpoint, leave the receipt values blank.
  // The owner can still capture the image and enter the fields for review.
  return {
    supplier: '',
    date: todayISO(),
    line_items: [],
    cogs_amount: 0,
    expense_amount: 0,
    total_zmw: 0,
    confidence: 0,
    smart_invoice_valid: null,
    supplier_tpin_verified: null,
    input_vat_amount: null,
    source: 'manual-entry',
  };
}

async function compressReceiptImage(file: File): Promise<{ fileData: string; mimeType: string }> {
  if (typeof createImageBitmap !== 'function') throw new Error('This browser cannot prepare the image securely. Try a recent browser or enter the receipt manually.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the receipt image. Enter the details manually.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let quality = 0.84;
    let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    for (let attempt = 0; blob && blob.size > 2.7 * 1024 * 1024 && attempt < 4; attempt += 1) {
      quality -= 0.1;
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    if (!blob || blob.size > 2.7 * 1024 * 1024) throw new Error('This receipt photo is too large to send safely. Choose a smaller image or enter the details manually.');
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare receipt image.'));
      reader.onerror = () => reject(new Error('Could not prepare receipt image.'));
      reader.readAsDataURL(blob);
    });
    return { fileData, mimeType: 'image/jpeg' };
  } finally {
    bitmap.close();
  }
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
    source: ['donut-live', 'veryfi-live'].includes(extraction.source) ? 'Receipt vision service' : 'Owner-entered receipt details',
  };
}
