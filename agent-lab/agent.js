(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const examples = Array.isArray(window.ZEDBIZ_PHRASES) ? window.ZEDBIZ_PHRASES : [];
  const records = [];
  const STOP = new Set('a an the i me my we our today this that for from of on in at to by with did do is was were are how what show tell give have had much business please'.split(' '));
  const NUMBER_WORDS = new Set('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand and'.split(' '));
  const SMALL = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
  const TENS = {twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
  let draft = null;
  let recognition = null;
  let listening = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function setStatus(message, state = 'ready') {
    $('#status').innerHTML = `<strong>${state === 'listening' ? 'Listening' : state === 'thinking' ? 'Thinking' : state === 'clarify' ? 'One question' : 'Ready'}</strong> · ${escapeHtml(message)}`;
    $('#main').classList.toggle('listening', state === 'listening');
    $('#main').classList.toggle('thinking', state === 'thinking');
  }
  function speak(message) {
    if (!$('#voiceReplies').checked || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-ZA';
    utterance.rate = 0.96;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => /^en(-|_)(ZA|GB)/i.test(voice.lang));
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  }
  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    window.setTimeout(() => node.classList.remove('show'), 2600);
  }
  function money(value) {
    return 'K' + Number(value).toLocaleString('en-ZM', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function normalizeWord(word) {
    const value = word.toLowerCase();
    const forms = {selling:'sell',sells:'sell',sold:'sell',sales:'sale',made:'make',making:'make',bought:'buy',buying:'buy',purchased:'purchase',purchases:'purchase',expenses:'expense',spent:'spend',costs:'cost',received:'receive',earning:'earn',earned:'earn',customers:'customer',totals:'total'};
    return forms[value] || value;
  }
  function tokens(text) {
    return text.toLowerCase().replace(/\b(?:k|zmw)?\s*\d[\d,.]*/gi, ' ')
      .replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).map(normalizeWord)
      .filter(word => word && !STOP.has(word) && !NUMBER_WORDS.has(word));
  }
  function dice(left, right) {
    if (!left.size || !right.size) return 0;
    let common = 0;
    for (const word of left) if (right.has(word)) common++;
    return (2 * common) / (left.size + right.size);
  }
  function classify(text) {
    const query = text.toLowerCase();
    const asksForResults = /\b(how much|how are|how did|what were|what is|show me|show my|summari[sz]e|summary|totals?)\b/.test(query);
    const asksAboutBusiness = /\b(sales?|expenses?|spend|spent|costs?|cash|business|records?|make|made|earn|earned|income)\b/.test(query);
    if (asksForResults && asksAboutBusiness) return {intent:'summary', strength:0.92};
    const input = new Set(tokens(text));
    const candidates = examples.map(item => {
      const samples = item.examples.map(phrase => dice(input, new Set(tokens(phrase))));
      const phraseScore = Math.max(0, ...samples);
      const anchorSet = new Set(item.anchors.map(normalizeWord));
      let anchorMatches = 0;
      for (const word of input) if (anchorSet.has(word)) anchorMatches++;
      const anchorScore = Math.min(1, anchorMatches / 2);
      return {intent:item.intent, score:0.65 * phraseScore + 0.35 * anchorScore};
    }).sort((a,b) => b.score-a.score);
    const best = candidates[0] || {intent:'unknown',score:0};
    const next = candidates[1] || {score:0};
    if (best.score < 0.31) return {intent:'unknown', strength:best.score};
    if (best.score - next.score < 0.09) return {intent:'ambiguous', strength:best.score};
    return {intent:best.intent, strength:best.score};
  }
  function wordsToNumber(phrase) {
    const words = phrase.toLowerCase().replace(/[^a-z\s-]/g,' ').replaceAll('-', ' ').split(/\s+/).filter(Boolean).filter(word => word !== 'and');
    if (!words.length || words.some(word => !NUMBER_WORDS.has(word))) return null;
    let total = 0, group = 0;
    for (const word of words) {
      if (Object.hasOwn(SMALL, word)) group += SMALL[word];
      else if (Object.hasOwn(TENS, word)) group += TENS[word];
      else if (word === 'hundred') group = (group || 1) * 100;
      else if (word === 'thousand') { total += (group || 1) * 1000; group = 0; }
    }
    const number = total + group;
    return number > 0 ? number : null;
  }
  function findAmount(text) {
    const marked = [...text.matchAll(/(?:\bK\s*|\bZMW\s*)(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*(?:kwacha|ZMW)\b/gi)]
      .map(match => Number((match[1] || match[2]).replaceAll(',',''))).filter(value => value > 0);
    if (marked.length === 1) return {amount:marked[0]};
    if (marked.length > 1) return {error:'I heard more than one amount. Which amount should I record?'};
    const numeric = [...text.matchAll(/\b\d[\d,]*(?:\.\d{1,2})?\b/g)].map(match => Number(match[0].replaceAll(',',''))).filter(value => value > 0);
    if (numeric.length === 1) return {amount:numeric[0]};
    if (numeric.length > 1) return {error:'I heard more than one number. Please repeat the transaction amount with K, for example K250.'};
    const numberSequence = `(?:${[...NUMBER_WORDS].join('|')})(?:\\s+(?:${[...NUMBER_WORDS].join('|')})){0,5}`;
    const wordPattern = new RegExp(`(?:\\bK\\s*(${numberSequence})\\b|\\b(${numberSequence})\\s+kwacha\\b)`, 'i');
    const wordMatch = text.match(wordPattern);
    const amount = wordMatch ? wordsToNumber(wordMatch[1] || wordMatch[2]) : null;
    return amount ? {amount} : {error:'I understood the business event, but not the amount. Please include an amount such as K250.'};
  }
  function categoryFor(intent, text) {
    const value = text.toLowerCase();
    if (intent === 'sale') return /bread|meal|vegetable|grocery|airtime|product|goods/.test(value) ? 'Product sales' : 'Sales';
    if (/transport|bus|taxi|fuel|petrol/.test(value)) return 'Transport';
    if (/stock|supply|goods|product|meal|oil/.test(value)) return 'Stock / supplies';
    if (/rent/.test(value)) return 'Rent';
    return 'Other expense';
  }
  function renderTotals() {
    const sales = records.filter(record => record.intent === 'sale').reduce((sum, record) => sum + record.amount, 0);
    const expenses = records.filter(record => record.intent === 'expense').reduce((sum, record) => sum + record.amount, 0);
    $('#sales').textContent = money(sales);
    $('#expenses').textContent = money(expenses);
    $('#net').textContent = money(sales - expenses);
    $('#recordCount').textContent = records.length ? `${records.length} confirmed ${records.length === 1 ? 'entry' : 'entries'} in this session` : 'No confirmed entries in this session';
  }
  function summarize(text) {
    const sales = records.filter(record => record.intent === 'sale').reduce((sum, record) => sum + record.amount, 0);
    const expenses = records.filter(record => record.intent === 'expense').reduce((sum, record) => sum + record.amount, 0);
    let answer = `You have ${records.length} confirmed ${records.length === 1 ? 'entry' : 'entries'}. Sales are ${money(sales)} and expenses are ${money(expenses)}. Recorded cash movement is ${money(sales-expenses)}. This is not profit.`;
    if (/spend|expense|cost/i.test(text) && !/sale|income|cash/i.test(text)) answer = `You have ${money(expenses)} in confirmed expenses in this session.`;
    else if (/sale|income|earn|make|made/i.test(text) && !/expense|spend|cost/i.test(text)) answer = `You have ${money(sales)} in confirmed sales in this session.`;
    $('#transcript').textContent = answer;
    setStatus('Here is your session summary.');
    speak(answer);
  }
  function makeDraft(text, intent, amount, strength) {
    const kind = intent === 'sale' ? 'sale' : 'expense';
    const category = categoryFor(intent, text);
    const dupe = records.some(record => record.intent === intent && record.amount === amount && record.source.toLowerCase() === text.trim().toLowerCase());
    if (dupe) {
      const answer = 'That sounds like an entry already confirmed in this demo session. I have not added it twice.';
      $('#transcript').textContent = answer;
      setStatus('Possible duplicate; nothing was added.', 'clarify');
      speak(answer);
      return;
    }
    draft = {intent,kind,category,amount,source:text.trim(),strength};
    $('#transcript').textContent = `You said: “${text.trim()}”`;
    $('#draftSlot').innerHTML = `<section class="draft"><div class="draft-head"><strong>Check this ${kind}</strong><span>Match strength · ${Math.round(strength*100)}%</span></div><div class="draft-source">${escapeHtml(text.trim())}</div><div class="draft-detail">Confirm or correct the suggested type and amount.</div><div class="draft-actions"><label class="sr-only" for="draftType">Transaction type</label><select id="draftType" aria-label="Transaction type"><option value="sale" ${intent==='sale'?'selected':''}>Sale</option><option value="expense" ${intent==='expense'?'selected':''}>Expense</option></select><label class="sr-only" for="draftAmount">Amount in kwacha</label><input id="draftAmount" inputmode="decimal" type="number" min="0.01" step="0.01" value="${amount.toFixed(2)}" aria-label="Amount in kwacha"/><button class="confirm" id="confirm">Confirm</button><button id="discard">Discard</button></div></section>`;
    setStatus('Review the suggested record before confirming.');
    const response = `I think this is a ${kind} for ${money(amount)}, categorized as ${category}. The match strength is ${Math.round(strength*100)} percent. Please check and confirm it, or correct the type and amount.`;
    speak(response);
    $('#confirm').onclick = () => {
      const correctedAmount = Number($('#draftAmount').value);
      const correctedType = $('#draftType').value;
      if (!Number.isFinite(correctedAmount) || correctedAmount <= 0) {
        const answer = 'Please enter a valid amount greater than zero.';
        setStatus(answer, 'clarify');
        speak(answer);
        $('#draftAmount').focus();
        return;
      }
      records.push({...draft,intent:correctedType,kind:correctedType,amount:correctedAmount,category:categoryFor(correctedType,text)});
      const answer = `Recorded ${correctedType} of ${money(correctedAmount)} for this demo session.`;
      draft = null;
      $('#draftSlot').innerHTML = '';
      renderTotals();
      setStatus('Added to this browser session.');
      speak(answer);
    };
    $('#discard').onclick = () => {
      draft = null;
      $('#draftSlot').innerHTML = '';
      const answer = 'Okay, I discarded that draft. It was not added.';
      setStatus('Draft discarded.');
      speak(answer);
    };
  }
  function handle(text) {
    const input = text.trim();
    if (!input) return;
    $('#draftSlot').innerHTML = '';
    draft = null;
    setStatus('Checking the synthetic phrase examples…', 'thinking');
    window.setTimeout(() => {
      const prediction = classify(input);
      if (prediction.intent === 'summary') return summarize(input);
      if (prediction.intent === 'unknown') {
        const answer = 'I do not recognize that request yet. Try recording a sale, an expense, or ask for your session summary. You can also add the phrase to the synthetic examples for a future demo update.';
        $('#transcript').textContent = answer;
        setStatus('I need a phrase I know before I can help.', 'clarify');
        speak(answer);
        return;
      }
      if (prediction.intent === 'ambiguous') {
        const answer = 'I am not sure whether you mean money received or money spent. Please say sale or expense, and include the amount.';
        $('#transcript').textContent = answer;
        setStatus('Please clarify sale or expense.', 'clarify');
        speak(answer);
        return;
      }
      const amountResult = findAmount(input);
      if (amountResult.error) {
        $('#transcript').textContent = amountResult.error;
        setStatus('Please repeat the amount.', 'clarify');
        speak(amountResult.error);
        return;
      }
      makeDraft(input, prediction.intent, amountResult.amount, prediction.strength);
    }, 180);
  }

  $('#form').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#entry');
    const value = input.value;
    input.value = '';
    handle(value);
  });
  document.querySelectorAll('.examples button').forEach(button => button.addEventListener('click', () => handle(button.dataset.text)));
  $('#voiceReplies').addEventListener('change', event => {
    if (!event.target.checked && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    else speak('Voice replies are on.');
  });

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    recognition = new Recognition();
    recognition.lang = 'en-ZA';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => { listening = true; $('#mic').classList.add('active'); $('#mic').setAttribute('aria-label','Stop speaking'); setStatus('Speak a sale, expense or question.', 'listening'); };
    recognition.onresult = event => {
      let spoken = '';
      for (let index = event.resultIndex; index < event.results.length; index++) spoken += event.results[index][0].transcript;
      $('#entry').value = spoken;
      $('#transcript').textContent = spoken ? `Hearing: “${spoken}”` : '';
      const last = event.results[event.results.length - 1];
      if (last && last.isFinal) { $('#entry').value = ''; handle(spoken); }
    };
    recognition.onerror = event => {
      const reasons = {notallowed:'Allow microphone access in your browser, then try again.',network:'The browser speech service needs a network connection. You can type instead.','no-speech':'I did not hear anything. Please try again.','audio-capture':'No microphone was detected. You can type instead.'};
      const answer = reasons[event.error] || 'Voice input did not work in this browser. You can type the same entry instead.';
      setStatus(answer, 'clarify');
      $('#transcript').textContent = answer;
      speak(answer);
    };
    recognition.onend = () => { listening = false; $('#mic').classList.remove('active'); $('#mic').setAttribute('aria-label','Start speaking'); if ($('#main').classList.contains('listening')) setStatus('Ready when you are.'); };
  } else {
    $('#mic').disabled = true;
    $('#mic').title = 'Voice recognition is unavailable in this browser. Type your entry instead.';
    setStatus('Voice recognition is unavailable here; typing still works.');
  }
  $('#mic').addEventListener('click', () => {
    if (!recognition) return toast('This browser does not support speech recognition.');
    try { listening ? recognition.stop() : recognition.start(); }
    catch { toast('Microphone is starting. Please wait a moment.'); }
  });
  renderTotals();
})();

