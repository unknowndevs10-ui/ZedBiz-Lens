import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEveningWrapUp } from './edgeLanguage.js';
import { parseMobileMoneyBatch } from './momoParser.js';

test('parses a mixed Nyanja/Zanglish evening summary into separate pending drafts', () => {
  const result = parseEveningWrapUp('Nagulisa 5 crates ya tomato pa K600, transport K50, na Mrs. Phiri watenga pa credit K150');
  assert.equal(result.kind, 'drafts');
  assert.equal(result.drafts.length, 3);
  assert.deepEqual(result.drafts.map((item) => item.draft.amount), [600, 50, 150]);
  assert.equal(result.drafts[0].draft.type, 'income');
  assert.equal(result.drafts[1].draft.category, 'Transport');
  assert.equal(result.drafts[2].draft.paymentMethod, 'credit');
  assert.equal(result.drafts[0].draft.itemName, 'tomato');
  assert.equal(result.drafts[0].draft.quantity, 5);
  assert.match(result.drafts[0].explanation, /nagulisa/i);
});

test('does not invent a category for an amount without a business action', () => {
  const result = parseEveningWrapUp('K80');
  assert.equal(result.kind, 'clarify');
});

test('cash count becomes an operations record rather than a sale', () => {
  const result = parseEveningWrapUp('Cash counted K850');
  assert.equal(result.drafts.length, 0);
  assert.equal(result.operations[0].type, 'cash_count');
  assert.equal(result.operations[0].actual, 850);
});

test('tax liability requests are not treated as ledger drafts', () => {
  const result = parseEveningWrapUp('How much VAT do I owe on K500?');
  assert.equal(result.kind, 'clarify');
});

test('batch MoMo parser separates business receipt, fee, and personal transfer', () => {
  const result = parseMobileMoneyBatch('Airtel Money received K500 from Mary. Fee K3 Ref ABCD123\nMTN MoMo sent K120 to family for personal use Ref XYZZ998');
  assert.equal(result.ok, true);
  assert.equal(result.messageCount, 2);
  assert.equal(result.draftCount, 3);
  assert.equal(result.drafts[0].draft.type, 'income');
  assert.equal(result.drafts[1].draft.category, 'Mobile money fees');
  assert.equal(result.drafts[2].draft.type, 'owner_withdrawal');
});

