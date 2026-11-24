import { parseEveningWrapUp } from './edgeLanguage';
import { parseMobileMoneyBatch } from './momoParser';
import { buildDecisionCards } from './decisionEngine';
import { extractReceipt, predictThirtyDayRevenue } from './engineAdapter';

export const AI_ENGINE_PILLARS = [
  { id: 'language', label: 'Language & intent', mode: 'Local phrase rules; optional FastAPI parser; synthetic SVM remains intent-only' },
  { id: 'vision', label: 'Receipt vision', mode: 'Donut-compatible endpoint; no image model is bundled' },
  { id: 'forecast', label: 'Revenue outlook', mode: 'Local seasonal baseline; optional XGBoost endpoint' },
  { id: 'director', label: 'System in check', mode: 'Explainable rules over owner-confirmed records' },
];

const agentApiBase = String(import.meta.env.VITE_AGENT_API_URL || '').replace(/\/$/, '');

/** Parse a whole evening update into independent, reviewable drafts. */
export async function parseBusinessWrapUp(text, profile = null) {
  if (!agentApiBase) return { ...parseEveningWrapUp(text), source: 'edge-synthetic-lexicon', model: 'local-rule-parser-v1' };
  try {
    const response = await fetch(`${agentApiBase}/api/v1/ai/parse-batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text || '').slice(0, 1200), language: profile?.language || 'mixed', business_type: profile?.businessType || 'other' }),
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.kind === 'drafts' && Array.isArray(payload.drafts)) return { ...payload, source: payload.source || 'fastapi-synthetic-rules' };
      if (payload?.kind === 'clarify') return { ...payload, source: payload.source || 'fastapi-synthetic-rules' };
    }
  } catch { /* Offline rules remain available if the optional API is down. */ }
  return { ...parseEveningWrapUp(text), source: 'edge-synthetic-lexicon', model: 'local-rule-parser-v1', fallback: true };
}

/** Batch parser separates business movements, transfer fees, and personal transfers. */
export function parseMomoBatch(text) {
  return parseMobileMoneyBatch(text);
}

/** Receipt extraction + explainable comparison to earlier confirmed purchases. */
export async function inspectReceipt(file, transactions = []) {
  const extraction = await extractReceipt(file);
  const alerts = [];
  for (const item of extraction.line_items || []) {
    const previous = transactions
      .filter((tx: any) => tx.status === 'confirmed' && tx.type === 'expense' && tx.category === 'Stock purchases'
        && String(tx.itemName || '').trim().toLowerCase() === String(item.description || '').trim().toLowerCase()
        && (!extraction.supplier || !tx.counterparty || String(tx.counterparty).trim().toLowerCase() === extraction.supplier.trim().toLowerCase())
        && Number(tx.unitCost) > 0)
      .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)))[0];
    if (previous && Number(item.unit_price) > Number(previous.unitCost) * 1.05) {
      const change = (Number(item.unit_price) / Number(previous.unitCost) - 1) * 100;
      alerts.push({ item: item.description, previousUnitCost: Number(previous.unitCost), newUnitCost: Number(item.unit_price), percentIncrease: Math.round(change * 10) / 10, explanation: `This unit price is ${Math.round(change * 10) / 10}% above the last confirmed purchase you recorded. Check the item, quantity and receipt before acting.` });
    }
  }
  return { extraction, alerts, modelStatus: ['donut-live', 'veryfi-live'].includes(extraction.source) ? 'external-receipt-model' : 'manual-receipt-entry' };
}

/** The adapter labels external model output and keeps deterministic fallback visible. */
export async function predictBusinessOutlook(history: Array<{ date: string; revenue: number }>, profile: any = {}) {
  const result = await predictThirtyDayRevenue(history, { profile });
  return {
    ...result,
    explanation: result.source === 'xgboost'
      ? 'Projection from the configured XGBoost service. The owner still decides what to do.'
      : 'Local arithmetic baseline from recent confirmed sales. It has no learned seasonal pattern and is not an XGBoost model or a guarantee.',
  };
}

/** One decision entry point for the dashboard. Rules may read signals; they never mutate the ledger. */
export function buildSystemInCheck({ profile, transactions = [], inventory = [], cashCount = null, forecast = null, creditSettlements = [] }: any) {
  const cards = buildDecisionCards({ profile, transactions, inventory, cashCount, forecast, creditSettlements });
  return {
    cards,
    source: 'explainable-business-rules',
    summary: cards.length ? `${cards.length} review prompt${cards.length === 1 ? '' : 's'} from confirmed activity.` : 'Add and confirm records to start the business review.',
    canWriteLedger: false,
    financialMath: 'ZRA_calculator.py + tax_rules.json; deterministic only',
  };
}

