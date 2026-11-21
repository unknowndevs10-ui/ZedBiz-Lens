import { addDays, todayISO } from '../utils/format.js';

const MONEY = /(?:\bK\s*|\bZK\s*|\bZMW\s*)(\d[\d,]*(?:\.\d{1,2})?)|\b(\d[\d,]*(?:\.\d{1,2})?)\s*(?:kwacha|zmw)\b/gi;
const TAX_OR_FILING = /\b(tax|vat|file|filing|return|registration|liable|deduct|submit)\b/i;
const INCOME_WORDS = /\b(sold|sell|sales|earned|received|income|customer paid|client paid|nagulisa|nagulitsa|nagulisha|tengesa|tengesa|watengesa)\b/i;
const CREDIT_WORDS = /\b(on credit|credit|pa ngongole|ngongole)\b/i;
const CASH_COUNT_WORDS = /\b(cash count|counted cash|cash counted|cash left in (?:the )?(?:till|drawer)|closing cash|cash close)\b/i;
const OWNER_DRAW_WORDS = /\b(personal transfer|personal use|family transfer|sent to family|owner withdrawal|owner drawing|personal drawing)\b/i;
const EXPENSE_CATEGORIES = [
  [/owner personal withdrawal|owner withdrawal|personal drawing|drawings/i, 'Owner personal withdrawal'],
  [/spoilage|wastage|damaged stock|unsold stock|expired stock/i, 'Spoilage & wastage'],
  [/mobile money fee|momo fee|transaction fee|transfer fee|airtel money fee|mtn fee|zamtel fee/i, 'Mobile money fees'],
  [/transport|fuel|taxi|\bbus\b|fare|delivery|ride/i, 'Transport'],
  [/rent/i, 'Rent'],
  [/electric|zesco|water|airtime|data bundle|bill|tokens|wifi/i, 'Utilities'],
  [/wage|salary|assistant|helper|staff/i, 'Wages'],
  [/levy|market fee|council|ticket/i, 'Market fees'],
  [/stock|goods|inventory|wholesale|supplies|restock|bought|buy|purchase|products|extensions|crates/i, 'Stock purchases'],
];

const amountMentions = (text) => [...String(text).matchAll(MONEY)].map((match) => ({
  amount: Number((match[1] || match[2]).replace(/,/g, '')),
  index: match.index || 0,
})).filter((item) => Number.isFinite(item.amount) && item.amount > 0);

function splitClauses(source) {
  return String(source)
    .replace(/\b(Mr|Mrs|Ms|Dr)\./gi, '$1<dot>')
    .split(/[;\n]+|,(?=\s*[A-Za-z])|\.(?!\d)|\s+\b(?:then|after that)\b\s+/i)
    .map((part) => part.replace(/<dot>/g, '.').trim())
    .filter(Boolean);
}

function languageOf(text) {
  const value = text.toLowerCase();
  if (/\b(nagulisa|tengesa|pa credit|watenga)\b/.test(value)) return 'Nyanja / Zanglish phrase match';
  if (/\b(nagulisha|nagulitsa|ngongole)\b/.test(value)) return 'Bemba / Nyanja phrase match';
  return 'English or mixed-language phrase match';
}

function counterpartyOf(text) {
  const match = String(text).match(/\b(?:na|from|to|customer|client|with)\s+((?:Mr|Mrs|Ms|Dr)\.?\s+)?([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,2})/);
  return match ? `${match[1] || ''}${match[2]}`.trim().slice(0, 80) : '';
}

function makeTransactionDraft(clause, amount) {
  const income = INCOME_WORDS.test(clause) || CREDIT_WORDS.test(clause);
  const personalDraw = OWNER_DRAW_WORDS.test(clause);
  const credit = CREDIT_WORDS.test(clause);
  const matchedCategory = EXPENSE_CATEGORIES.find(([pattern]) => pattern.test(clause))?.[1];
  const type = personalDraw ? 'owner_withdrawal' : income ? 'income' : 'expense';
  const category = personalDraw ? 'Owner personal withdrawal' : income ? 'Sales' : matchedCategory || 'Other expenses';
  const languageEvidence = languageOf(clause);
  const keyword = clause.match(/\b(nagulisa|nagulitsa|nagulisha|tengesa|tengesa|watengesa|sold|transport|credit|ngongole|personal transfer)\b/i)?.[1];
  const quantityMatch = clause.match(/\b(\d+(?:\.\d+)?)\s*(crates?|boxes?|bags?|units?|items?|pieces?|kg|kilograms?)\s*(?:ya|of|za)?\s*([a-z][a-z-]*)?/i);
  const quantity = quantityMatch ? Number(quantityMatch[1]) : null;
  const itemName = quantityMatch?.[3] || clause.match(/\b(?:tomatoes?|onions?|potatoes?|cabbage|vegetables?|fish|eggs?)\b/i)?.[0] || '';
  return {
    kind: 'transaction',
    draft: {
      type,
      category,
      description: clause.slice(0, 80),
      amount,
      date: /\byesterday\b/i.test(clause) ? addDays(todayISO(), -1) : todayISO(),
      paymentMethod: credit ? 'credit' : /cash|notes|coins/i.test(clause) ? 'cash' : /momo|mobile money|airtel|mtn|zamtel/i.test(clause) ? 'mobile_money' : 'unspecified',
      counterparty: counterpartyOf(clause),
      itemName: itemName.slice(0, 80),
      quantity,
      unitCost: quantity && type === 'expense' ? Math.round((amount / quantity) * 100) / 100 : null,
      confidence: keyword ? 0.78 : matchedCategory ? 0.7 : 0.55,
      ...(income ? { taxable: 'unsure', taxReason: 'The local parser does not decide tax treatment. Review before confirming.' } : {}),
    },
    sourceText: clause,
    confidence: keyword ? 0.78 : matchedCategory ? 0.7 : 0.55,
    explanation: `Detected ${languageEvidence}${keyword ? ` and keyword "${keyword}"` : ''} + explicit K${amount.toLocaleString('en-ZM')}. This creates a draft for your review.`,
    reviewReasons: ['synthetic_edge_parser', 'human_confirmation_required'],
  };
}

/** Local zero-key parser. It only extracts explicit amounts and never confirms entries. */
export function parseEveningWrapUp(input) {
  const source = String(input || '').trim().slice(0, 1200);
  if (source.length < 3) return { kind: 'clarify', drafts: [], operations: [], message: 'Tell me what happened in the business in a few words.' };
  if (TAX_OR_FILING.test(source)) return { kind: 'clarify', drafts: [], operations: [], message: 'I can organise records, but I do not answer tax-liability or filing questions. Use the Tax Readiness view and review with Finance.' };
  const drafts = [];
  const operations = [];
  const unparsed = [];
  for (const clause of splitClauses(source)) {
    const amounts = amountMentions(clause);
    if (CASH_COUNT_WORDS.test(clause)) {
      if (amounts.length === 1) operations.push({ type: 'cash_count', actual: amounts[0].amount, date: todayISO(), sourceText: clause, explanation: 'Cash-count phrase plus one explicit Kwacha amount. This is a till-check record, not income.' });
      else if (amounts.length > 1) unparsed.push({ text: clause, reason: 'Cash count has more than one amount; enter opening float and closing count separately.' });
      continue;
    }
    if (amounts.length !== 1) {
      if (amounts.length || /\b(sold|spent|paid|bought|nagulisa|nagulisha|transport|rent|credit|ngongole)\b/i.test(clause)) unparsed.push({ text: clause, reason: amounts.length ? 'This clause has more than one amount; split it into one fact per amount.' : 'I found a business action but no explicit Kwacha amount.' });
      continue;
    }
    const hasBusinessCue = INCOME_WORDS.test(clause) || CREDIT_WORDS.test(clause) || OWNER_DRAW_WORDS.test(clause)
      || EXPENSE_CATEGORIES.some(([pattern]) => pattern.test(clause))
      || /\b(paid|spent|bought|purchase|purchased|cost|fee|charges|money out|money in)\b/i.test(clause);
    if (!hasBusinessCue) {
      unparsed.push({ text: clause, reason: 'I found an amount but not whether it was a sale, expense or personal movement.' });
      continue;
    }
    drafts.push(makeTransactionDraft(clause, amounts[0].amount));
  }
  if (!drafts.length && !operations.length) return { kind: 'clarify', drafts, operations, unparsed, message: unparsed[0]?.reason || 'Add one clear Kwacha amount, like K250.' };
  return { kind: 'drafts', drafts, operations, unparsed, explanation: 'Each item is a separate reviewable draft. Nothing changes confirmed totals until you confirm it.' };
}

export function detectMomoPersonalTransfer(text) {
  return OWNER_DRAW_WORDS.test(String(text || '')) || /\b(?:sent|paid|transfer(?:red)?)\b.*\b(?:my own|myself|family|personal)\b/i.test(String(text || ''));
}


