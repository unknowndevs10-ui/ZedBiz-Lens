import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, interpretLocally } from './agentService.js';

test('classifies common synthetic sales and expense notes', () => {
  assert.equal(classifyIntent('I sold bread for K120').intent, 'sale');
  assert.equal(classifyIntent('Paid rent of K1200').intent, 'expense');
  assert.equal(classifyIntent('Give me a business summary').intent, 'summary');
  assert.equal(classifyIntent('What are my earnings').intent, 'summary');
});

test('refuses unsupported requests instead of drafting an action', () => {
  assert.equal(interpretLocally('What is the weather today').kind, 'clarify');
  assert.equal(interpretLocally('How much tax do I owe').kind, 'clarify');
});

test('requires one explicit Kwacha amount before creating a draft', () => {
  assert.equal(interpretLocally('I sold bread').kind, 'clarify');
  assert.match(interpretLocally('I sold bread for K120 and K80').message, /more than one amount/i);
  const result = interpretLocally('I sold bread for K120');
  assert.equal(result.kind, 'draft');
  assert.equal(result.draft.type, 'income');
  assert.equal(result.draft.amount, 120);
  assert.equal(result.draft.taxable, 'unsure');
});

test('income tax treatment remains unresolved and expense drafts stay pending downstream', () => {
  const sale = interpretLocally('I earned K250 from sales');
  const expense = interpretLocally('I spent K35 on transport');
  assert.equal(sale.draft.taxable, 'unsure');
  assert.equal(expense.draft.type, 'expense');
  assert.equal(expense.draft.category, 'Transport');
});

test('business profile shapes sale categories without changing intent or tax decisions', () => {
  const marketSale = interpretLocally('I sold tomatoes for K80', { businessType: 'Market trader' });
  const farmSale = interpretLocally('I sold tomatoes for K80', { businessType: 'Agriculture' });
  assert.equal(marketSale.draft.category, 'Market sales');
  assert.equal(farmSale.draft.category, 'Produce sales');
  assert.equal(marketSale.draft.taxable, 'unsure');
});
