import { SYNTHETIC_INTENT_EXAMPLES } from '../data/syntheticIntentExamples.js';
import { addDays, todayISO } from '../utils/format.js';
import { config } from '../config.js';

const CLASSES = ['sale', 'expense', 'summary', 'unknown'];
const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'for', 'from', 'i', 'in', 'is', 'me', 'my', 'of', 'the', 'to', 'was', 'were', 'what', 'when', 'how', 'today']);
const MAX_INPUT_LENGTH = 500;
const TAX_OR_FILING_REQUEST = /\b(tax|vat|file|filing|return|register|registration|owe|liable|deduct|submit)\b/i;
const SUMMARY_REQUEST = /\b(how much|what (?:are|were|did) (?:my|the)|show (?:my |today |total )?(?:sales|expenses|business|records|ledger|numbers|profit)|give me (?:a|my|the) (?:business )?summary|summari[sz]e|overview|how is (?:my )?business|cash movement|sales and expenses|my earnings)\b/i;

function featuresOf(text) {
  const normalized = String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter((word) => word && !STOP_WORDS.has(word));
  const features = new Set(words.map((word) => `w:${word}`));
  for (const word of words) {
    const padded = `^${word}$`;
    for (let i = 0; i < padded.length - 2; i += 1) features.add(`c:${padded.slice(i, i + 3)}`);
  }
  for (let i = 0; i < words.length - 1; i += 1) features.add(`b:${words[i]}_${words[i + 1]}`);
  return features;
}

function trainNaiveBayes(examples) {
  const counts = Object.fromEntries(CLASSES.map((label) => [label, new Map()]));
  const documents = Object.fromEntries(CLASSES.map((label) => [label, 0]));
  const totals = Object.fromEntries(CLASSES.map((label) => [label, 0]));
  const vocabulary = new Set();
  for (const [text, label] of examples) {
    documents[label] += 1;
    for (const feature of featuresOf(text)) {
      vocabulary.add(feature);
      const map = counts[label];
      map.set(feature, (map.get(feature) || 0) + 1);
      totals[label] += 1;
    }
  }
  return { counts, documents, totals, vocabulary, size: examples.length };
}

const model = trainNaiveBayes(SYNTHETIC_INTENT_EXAMPLES);

export function classifyIntent(text) {
  if (TAX_OR_FILING_REQUEST.test(text)) return { intent: 'unknown', confidence: 1, needsClarification: true, modelVersion: 'synthetic-nb-0.1' };
  if (SUMMARY_REQUEST.test(text)) return { intent: 'summary', confidence: 1, needsClarification: false, modelVersion: 'synthetic-nb-0.1' };
  const features = featuresOf(text);
  if (!features.size) return { intent: 'unknown', confidence: 0, modelVersion: 'synthetic-nb-0.1' };
  const scores = CLASSES.map((label) => {
    let score = Math.log((model.documents[label] + 1) / (model.size + CLASSES.length));
    const denominator = model.totals[label] + model.vocabulary.size;
    for (const feature of features) score += Math.log(((model.counts[label].get(feature) || 0) + 1) / denominator);
    return { intent: label, score };
  });
  const max = Math.max(...scores.map((item) => item.score));
  const probabilities = scores.map((item) => ({ ...item, probability: Math.exp(item.score - max) }));
  const total = probabilities.reduce((sum, item) => sum + item.probability, 0);
  probabilities.forEach((item) => { item.probability /= total; });
  probabilities.sort((a, b) => b.probability - a.probability);
  const winner = probabilities[0];
  const runnerUp = probabilities[1];
  const confident = winner.probability >= 0.42 && winner.probability - runnerUp.probability >= 0.12;
  return {
    intent: confident ? winner.intent : 'unknown',
    confidence: Number(winner.probability.toFixed(3)),
    needsClarification: !confident,
    modelVersion: 'synthetic-nb-0.1',
  };
}

function amountFromText(text) {
  const matches = [...String(text).matchAll(/(?:\bK\s*|\bZK\s*|\bZMW\s*)(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*(?:kwacha|ZMW)\b/gi)];
  const values = matches.map((match) => Number((match[1] || match[2]).replace(/,/g, ''))).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length === 1) return { amount: values[0] };
  if (values.length > 1) return { error: 'I found more than one amount. Please send one entry at a time.' };
  return { error: 'Add one clear amount, for example K250, and I will prepare a draft.' };
}

function categoryFor(text, type) {
  if (type === 'income') return /hair|braid|weave|plait|styling|client|service/i.test(text) ? 'Services' : 'Sales';
  const categories = [
    [/rent/i, 'Rent'],
    [/electric|zesco|water|airtime|data bundle|bill|tokens|wifi/i, 'Utilities'],
    [/wage|salary|assistant|helper|staff/i, 'Wages'],
    [/levy|market fee|council|ticket/i, 'Market fees'],
    [/transport|fuel|taxi|bus|fare|delivery|ride/i, 'Transport'],
    [/stock|goods|inventory|wholesale|supplies|restock|bought|buy|purchase|products|extensions/i, 'Stock purchases'],
  ];
  return categories.find(([pattern]) => pattern.test(text))?.[1] || 'Other expenses';
}

export function interpretLocally(text) {
  const source = String(text || '').trim();
  if (source.length < 3) return { kind: 'clarify', message: 'Tell me what happened in the business in a few words.' };
  if (source.length > MAX_INPUT_LENGTH) return { kind: 'clarify', message: `Keep this note under ${MAX_INPUT_LENGTH} characters for the demo.` };

  const prediction = classifyIntent(source);
  if (prediction.intent === 'summary') return { kind: 'summary', prediction };
  if (prediction.intent === 'unknown') return { kind: 'clarify', prediction, message: 'I am not confident about that yet. Try a sample sale, expense, or ask for a business summary.' };

  const parsed = amountFromText(source);
  if (parsed.error) return { kind: 'clarify', prediction, message: parsed.error };
  const type = prediction.intent === 'sale' ? 'income' : 'expense';
  const taxable = type === 'income' ? { taxable: 'unsure', taxReason: 'The demo agent does not decide tax treatment. Please review this label.' } : {};
  const yesterday = /\byesterday\b/i.test(source);
  return {
    kind: 'draft',
    prediction,
    draft: {
      type,
      category: categoryFor(source, type),
      description: source.length > 80 ? `${source.slice(0, 77)}...` : source,
      amount: parsed.amount,
      date: yesterday ? addDays(todayISO(), -1) : todayISO(),
      confidence: prediction.confidence,
      ...taxable,
    },
  };
}

function categoryForService(text, type) {
  if (type === 'income') return /hair|braid|weave|plait|styling|client|service/i.test(text) ? 'Services' : 'Sales';
  const categories = [
    [/rent/i, 'Rent'], [/electric|zesco|water|airtime|data bundle|bill|tokens|wifi/i, 'Utilities'],
    [/wage|salary|assistant|helper|staff/i, 'Wages'], [/levy|market fee|council|ticket/i, 'Market fees'],
    [/transport|fuel|taxi|bus|fare|delivery|ride/i, 'Transport'],
    [/stock|goods|inventory|wholesale|supplies|restock|bought|buy|purchase|products|extensions/i, 'Stock purchases'],
  ];
  return categories.find(([pattern]) => pattern.test(text))?.[1] || 'Other expenses';
}

/** Use the team's FastAPI SVM when configured; otherwise use the offline synthetic baseline. */
export async function interpretAgentInput(text) {
  if (!config.agentApiBaseUrl) return interpretLocally(text);
  const response = await fetch(`${config.agentApiBaseUrl}/api/v1/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language: 'en-ZA' }),
  });
  let payload;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) throw new Error(payload?.detail || 'The configured agent service could not interpret that note.');
  if (payload?.intent === 'summary') return { kind: 'summary', prediction: { intent: 'summary', modelVersion: payload.model_version, source: 'fastapi' } };
  if (payload?.needs_clarification || !['sale', 'expense'].includes(payload?.intent) || !payload?.draft || !(Number(payload.draft.amount) > 0)) {
    return { kind: 'clarify', prediction: { intent: payload?.intent || 'unknown', modelVersion: payload?.model_version, source: 'fastapi' }, message: payload?.question || 'I need one clearer detail before I can prepare a draft.' };
  }
  const type = payload.intent === 'sale' ? 'income' : 'expense';
  const source = String(text).trim();
  return {
    kind: 'draft',
    prediction: { intent: payload.intent, modelVersion: payload.model_version, source: 'fastapi', confidence: null },
    draft: {
      type,
      category: categoryForService(source, type),
      description: source.length > 80 ? `${source.slice(0, 77)}...` : source,
      amount: Number(payload.draft.amount),
      date: /\byesterday\b/i.test(source) ? addDays(todayISO(), -1) : todayISO(),
      confidence: null,
      ...(type === 'income' ? { taxable: 'unsure', taxReason: 'The agent does not decide tax treatment. Please review this label.' } : {}),
    },
  };
}

export const AGENT_MODEL_INFO = {
  name: config.agentApiBaseUrl ? 'Agent Lab FastAPI model' : 'Naive Bayes intent baseline',
  version: 'synthetic-nb-0.1',
  examples: SYNTHETIC_INTENT_EXAMPLES.length,
  validation: 'Synthetic English phrases only. Not validated on real businesses, accents, or local languages.',
};
