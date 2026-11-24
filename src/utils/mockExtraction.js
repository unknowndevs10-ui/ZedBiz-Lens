// MOCK extraction. This is a small keyword/regex rule set used to demo the review flow.
// It is NOT an AI model. The real extraction will come from the backend.
import { addDays, todayISO } from './format';

const AMOUNT = /(?:\bK|\bZMW\s?|\bZK\s?)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:kwacha|zmw)\b/i;
const HAS_CURRENCY_MARK = /\bK\s?\d|\bZMW|\bZK|kwacha/i;
const SPLITTER = /\.(?!\d)|;|\n|,(?!\d{3}\b)|\s+and\s+|\s+then\s+/i;
const INCOME_WORDS = /\b(sold|sale|sales|earned|received|income|customer|customers|client|clients|braided|plaited|styled|revenue|made)\b/i;
const SERVICE_WORDS = /\b(hair|braid|braided|weave|relaxer|plait|plaited|styled|wash|client|clients|treatment)\b/i;
const CASH_WORDS = /\b(cash|notes|coins|physical cash)\b/i;
const MOBILE_MONEY_WORDS = /\b(mobile money|momo|airtel money|mtn momo|zamtel kwacha)\b/i;

const EXPENSE_CATEGORY_RULES = [
  [/owner personal withdrawal|owner withdrawal|personal drawing|drawings/i, 'Owner personal withdrawal'],
  [/spoilage|wastage|damaged stock|unsold stock|expired stock/i, 'Spoilage & wastage'],
  [/rent/i, 'Rent'],
  [/electric|zesco|water|airtime|data bundle|bill|tokens|wifi/i, 'Utilities'],
  [/wage|salary|assistant|helper|staff/i, 'Wages'],
  [/levy|market fee|council|ticket/i, 'Market fees'],
  [/transport|fuel|taxi|\bbus\b|fare|delivery|ride/i, 'Transport'],
  [/stock|goods|inventory|wholesale|supplies|restock|bought|buy|purchase|products|extensions/i, 'Stock purchases'],
];

// MOCK tax label for income lines. Placeholder rules, NOT tax advice. The backend AI replaces this.
// Values: 'taxable' | 'not_taxable' | 'unsure'
const NON_TAXABLE_WORDS = /\b(loan|borrowed|gift|refund|deposit|capital|reimburse|reimbursed)\b/i;

export function classifyTaxable(segment, category) {
  if (NON_TAXABLE_WORDS.test(segment)) return { taxable: 'not_taxable', taxReason: 'Looks like a loan, gift or refund rather than business sales.' };
  if (category === 'Other income') return { taxable: 'unsure', taxReason: 'Unclear source of income. Please check.' };
  return { taxable: 'taxable', taxReason: 'Sales of goods or services.' };
}

function parseAmount(segment) {
  const match = segment.match(AMOUNT);
  if (!match) return null;
  const value = Number((match[1] || match[2]).replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function tidy(segment) {
  const cleaned = segment.replace(/^\s*(i|we|also|plus)\s+/i, '').replace(/\s+/g, ' ').trim();
  const text = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export function extractTransactions(text) {
  const today = todayISO();
  const results = [];
  const ignored = [];

  for (const raw of String(text).split(SPLITTER)) {
    const segment = raw.trim();
    if (!segment) continue;

    const amount = parseAmount(segment);
    if (!amount) {
      ignored.push(segment);
      continue;
    }

    const isIncome = INCOME_WORDS.test(segment);
    let category;
    let categoryMatched = true;
    if (isIncome) {
      category = SERVICE_WORDS.test(segment) ? 'Services' : 'Sales';
    } else {
      const rule = EXPENSE_CATEGORY_RULES.find(([pattern]) => pattern.test(segment));
      categoryMatched = Boolean(rule);
      category = rule ? rule[1] : 'Other expenses';
    }

    // Confidence is a rule-based heuristic for the demo UI only.
    let confidence = 0.6;
    if (isIncome || /\b(bought|paid|spent|buy|purchase)\b/i.test(segment)) confidence += 0.12;
    if (categoryMatched) confidence += 0.14;
    if (HAS_CURRENCY_MARK.test(segment)) confidence += 0.06;
    if (segment.split(/\s+/).length < 4) confidence -= 0.08; // very short notes are harder to read
    confidence = Math.min(0.97, Math.max(0.5, Number(confidence.toFixed(2))));

    results.push({
      ...(isIncome ? classifyTaxable(segment, category) : {}),
      type: isIncome ? 'income' : 'expense',
      category,
      description: tidy(segment),
      amount,
      date: /\byesterday\b/i.test(segment) ? addDays(today, -1) : today,
      ...(CASH_WORDS.test(segment) ? { paymentMethod: 'cash' } : MOBILE_MONEY_WORDS.test(segment) ? { paymentMethod: 'mobile_money' } : {}),
      ...( /owner personal withdrawal|owner withdrawal|personal drawing|drawings/i.test(segment) ? { type: 'owner_withdrawal' } : {}),
      confidence,
    });
  }
  return { transactions: results, ignored };
}
