import { createClient } from '@supabase/supabase-js';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VERYFI_URL = 'https://api.veryfi.com/api/v8/partner/documents';

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

function field(value) {
  if (value && typeof value === 'object' && Object.hasOwn(value, 'value')) return value.value;
  return value;
}

function score(value) {
  const n = Number(value?.score);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
}

function toDate(value) {
  const raw = String(field(value) || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function fileSignatureMatches(buffer, type) {
  if (type === 'image/jpeg') return buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function normalizeVeryfi(document) {
  const total = Number(field(document?.total));
  if (!Number.isFinite(total) || total <= 0) throw new Error('The receipt reader could not confidently find a positive total. Enter it manually.');
  const currency = String(field(document?.currency_code) || '').trim().toUpperCase() || null;
  const lineItems = Array.isArray(document?.line_items) ? document.line_items.slice(0, 100).map((item) => {
    const quantity = Number(field(item?.quantity)) || 0;
    const amount = Number(field(item?.total)) || 0;
    const unitPrice = Number(field(item?.price)) || (quantity > 0 ? amount / quantity : amount);
    return {
      description: String(field(item?.description) || field(item?.text) || 'Unlabelled item').slice(0, 100),
      quantity: quantity > 0 ? quantity : 1,
      unit_price: unitPrice,
      amount: amount > 0 ? amount : unitPrice,
    };
  }) : [];
  const confidenceScores = [score(document?.total), score(document?.date), score(document?.vendor?.name || document?.vendor_name)].filter((n) => n !== null);
  return {
    supplier: String(field(document?.vendor?.name || document?.vendor_name) || '').slice(0, 100),
    date: toDate(document?.date),
    line_items: lineItems,
    cogs_amount: 0,
    expense_amount: 0,
    total_zmw: total,
    currency_code: currency,
    confidence: confidenceScores.length ? confidenceScores.reduce((sum, n) => sum + n, 0) / confidenceScores.length : 0,
    smart_invoice_valid: null,
    supplier_tpin_verified: null,
    input_vat_amount: null,
    source: 'veryfi-live',
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({ configured: Boolean(process.env.VERYFI_CLIENT_ID && process.env.VERYFI_API_KEY), provider: 'Veryfi' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return fail(res, 405, 'Method not allowed.');
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return fail(res, 401, 'Sign in to read a receipt.');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return fail(res, 503, 'Receipt service authentication is not configured.');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user?.id) return fail(res, 401, 'Your sign-in session could not be verified.');

  const clientId = process.env.VERYFI_CLIENT_ID;
  const apiKey = process.env.VERYFI_API_KEY;
  if (!clientId || !apiKey) return fail(res, 503, 'Receipt reading is not connected yet.');

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const mimeType = String(body.mime_type || '').toLowerCase();
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(String(body.file_data || ''));
  if (!ALLOWED_TYPES.has(mimeType) || !match || match[1].toLowerCase() !== mimeType) return fail(res, 400, 'Upload a JPG, PNG, or WebP receipt image.');
  const image = Buffer.from(match[2], 'base64');
  if (!image.length || image.length > MAX_IMAGE_BYTES) return fail(res, 413, 'The receipt image must be 3 MB or smaller after compression.');
  if (!fileSignatureMatches(image, mimeType)) return fail(res, 400, 'The image file could not be verified. Please choose another receipt photo.');

  const form = new FormData();
  const safeName = String(body.file_name || 'receipt').replace(/[^\w.-]/g, '_').slice(0, 100) || 'receipt';
  form.append('file', new Blob([image], { type: mimeType }), safeName);
  form.append('file_name', safeName);
  form.append('country', 'ZM');
  form.append('confidence_details', 'true');

  try {
    const upstream = await fetch(VERYFI_URL, {
      method: 'POST',
      headers: { 'Client-Id': clientId, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      body: form,
      signal: AbortSignal.timeout(110_000),
    });
    if (!upstream.ok) {
      console.error('Veryfi receipt request failed', { status: upstream.status, userId: authData.user.id });
      return fail(res, upstream.status === 429 ? 429 : 502, upstream.status === 429 ? 'Receipt reading is temporarily rate limited. Try again shortly.' : 'The receipt reader could not process this image. Enter the details manually.');
    }
    const document = await upstream.json();
    let result;
    try {
      result = normalizeVeryfi(document);
    } finally {
      if (document?.id !== undefined && document?.id !== null) {
        const cleanup = await fetch(`${VERYFI_URL}/${encodeURIComponent(String(document.id))}`, {
          method: 'DELETE',
          headers: { 'Client-Id': clientId, Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(8_000),
        }).catch(() => null);
        if (!cleanup?.ok) console.error('Veryfi receipt cleanup did not confirm deletion', { userId: authData.user.id });
      }
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Veryfi receipt extraction failed', { userId: authData.user.id, message: error?.message || 'unknown error' });
    return fail(res, 502, 'The receipt reader is temporarily unavailable. Enter the values manually.');
  }
}
