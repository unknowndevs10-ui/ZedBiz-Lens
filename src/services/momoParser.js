const MONEY = /\bK\s?([0-9][0-9,]*(?:\.\d{1,2})?)|\bZMW\s?([0-9][0-9,]*(?:\.\d{1,2})?)/gi;
const FEE_LABEL = /(?:fee|charge|charges|transaction cost)\D{0,12}(?:K\s?|ZMW\s?)([0-9][0-9,]*(?:\.\d{1,2})?)/i;
const REF_LABEL = /\b(?:txn|transaction|reference|ref)\s*(?:id|number|no\.?|#|:)?\s*([A-Z0-9-]{5,24})/i;

/** Zero-API-key draft parser. It extracts labelled currency values and always requires review. */
export function parseMobileMoneySms(message) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  if (!text || text.length > 1200) return { ok: false, reason: 'Paste one mobile-money message under 1,200 characters.' };
  const feeMatch = text.match(FEE_LABEL);
  const feeAmount = feeMatch ? Number(feeMatch[1].replace(/,/g, '')) : null;
  const amounts = [...text.matchAll(MONEY)].map((match) => ({
    amount: Number((match[1] || match[2]).replace(/,/g, '')),
    position: match.index || 0,
    leading: text.slice(Math.max(0, (match.index || 0) - 28), match.index || 0).toLowerCase(),
  })).filter((item) => Number.isFinite(item.amount) && item.amount > 0 && !/(?:fee|charge|balance|available balance)\D*$/.test(item.leading));
  if (!amounts.length) return { ok: false, reason: 'No labelled Kwacha amount found. Check the message or enter the transaction manually.' };
  const incoming = /\b(received|credited|deposit received|money in|paid you)\b/i.test(text);
  const outgoing = /\b(sent|debited|you paid|payment to|purchase|cash out|withdrawal|money out)\b/i.test(text);
  const direction = incoming === outgoing ? null : incoming ? 'income' : 'expense';
  const ref = text.match(REF_LABEL)?.[1] || '';
  const partyMatch = text.match(/\b(?:from|to)\s+([A-Za-z][A-Za-z0-9 '&.-]{1,48}?)(?=\s+(?:amount|for|on|ref|reference|txn|transaction|fee|balance)|[.,;]|$)/i);
  const counterparty = partyMatch?.[1]?.trim() || '';
  const amount = amounts[0].amount;
  const method = 'mobile_money';
  const personalTransfer = /\b(personal|family|my own|myself|household)\b/i.test(text);
  return {
    ok: true,
    direction,
    amount,
    feeAmount: Number.isFinite(feeAmount) ? feeAmount : null,
    reference: ref,
    counterparty,
    paymentMethod: method,
    confidence: direction && ref ? 0.86 : 0.62,
    needsDirectionReview: !direction,
    provider: /airtel/i.test(text) ? 'Airtel Money' : /mtn/i.test(text) ? 'MTN MoMo' : /zamtel|kwacha/i.test(text) ? 'Zamtel Kwacha' : 'Mobile money',
    personalTransfer,
  };
}

/** Parse several SMS messages at once; every proposed movement remains unconfirmed. */
export function parseMobileMoneyBatch(messages) {
  const lines = String(messages || '').split(/\r?\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 20);
  if (!lines.length) return { ok: false, reason: 'Paste one or more mobile-money SMS messages, one per line.' };
  const parsed = lines.map((text, index) => ({ index, text, ...parseMobileMoneySms(text) }));
  const results = parsed.map((item) => {
    if (!item.ok) return { index: item.index, provider: item.provider || 'Mobile money', status: 'needs-review', explanation: item.reason, drafts: [] };
    if (!item.direction) return { index: item.index, provider: item.provider, status: 'needs-review', explanation: 'Direction is ambiguous. Choose money received or money sent before saving.', parsed: item, drafts: [] };
    if (item.personalTransfer && item.direction === 'income') return {
      index: item.index, provider: item.provider, status: 'personal-transfer', explanation: 'This looks like personal money coming in. It is excluded from business sales; classify it with an accountant if it was capital or a loan.', parsed: item, drafts: [],
    };
    const personalOutgoing = item.personalTransfer && item.direction === 'expense';
    const transactionDraft = {
      type: personalOutgoing ? 'owner_withdrawal' : item.direction,
      category: personalOutgoing ? 'Owner personal withdrawal' : item.direction === 'income' ? 'Sales' : 'Other expenses',
      description: `${personalOutgoing ? 'Personal transfer' : item.direction === 'income' ? 'Mobile-money receipt' : 'Mobile-money payment'}${item.counterparty ? ` � ${item.counterparty}` : ''}`,
      amount: item.amount,
      date: new Date().toISOString().slice(0, 10),
      confidence: item.confidence,
      paymentMethod: 'mobile_money',
      reference: item.reference,
      counterparty: item.counterparty,
      feeAmount: item.feeAmount,
      ...(item.direction === 'income' && !personalOutgoing ? { taxable: 'unsure', taxReason: 'The SMS parser does not decide tax treatment. Review this label.' } : {}),
    };
    const drafts = [{ kind: 'transaction', draft: transactionDraft, explanation: personalOutgoing ? 'Outgoing personal transfer is kept separate from business costs and profit.' : `Parsed ${item.provider} ${item.direction === 'income' ? 'receipt' : 'payment'} with an explicit Kwacha amount.`, sourceText: item.text }];
    if (Number(item.feeAmount) > 0) drafts.push({
      kind: 'transaction',
      draft: { type: 'expense', category: 'Mobile money fees', description: `${item.provider} transaction fee`, amount: Number(item.feeAmount), date: transactionDraft.date, confidence: item.confidence, paymentMethod: 'mobile_money', reference: item.reference, counterparty: item.counterparty },
      explanation: 'Fee is a separate pending expense draft. Confirm it independently; it is not included in the transfer amount.',
      sourceText: item.text,
    });
    return { index: item.index, provider: item.provider, status: personalOutgoing ? 'personal-transfer' : 'drafts-ready', explanation: personalOutgoing ? 'Personal amount is not business revenue or a deductible expense.' : 'Review each draft below before adding them to your ledger.', parsed: item, drafts };
  });
  const drafts = results.flatMap((result) => result.drafts);
  return { ok: true, results, drafts, messageCount: lines.length, draftCount: drafts.length };
}

