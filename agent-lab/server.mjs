import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4175);
const model = process.env.ZEDBIZ_MODEL || 'qwen3.5:2b';
const ollama = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };

const schema = {
  type: 'object', additionalProperties: false,
  properties: {
    intent: { type: 'string', enum: ['sale', 'expense', 'summary', 'clarify'] },
    amount: { type: ['number', 'null'] },
    description: { type: 'string' },
    question: { type: 'string' },
    missing_fields: { type: 'array', items: { type: 'string' } }
  },
  required: ['intent', 'amount', 'description', 'question', 'missing_fields']
};

const system = `You are the language and interaction layer for a Zambian small-business record-keeping demo. Understand the owner's latest message and return only the requested JSON object. Supported intents are sale, expense, summary, and clarify. Extract a single explicit transaction amount into a number in ZMW; if there are multiple plausible amounts, do not guess. Ask a brief question when the transaction type or amount is unclear. A sale is money received for goods/services; an expense is money paid by the business. Do not invent dates, amounts, products, tax categories, tax rates, tax liability, profit, or facts. Never calculate tax or profit. Summary requests must use intent summary. If the owner's latest message answers a prior clarification, use the prior message context. For clarify, put the question in question; for other intents, question must be empty. Description should be a short description grounded in the owner's words. missing_fields should list missing or ambiguous transaction fields. This is a draft only; a human confirms it.`;

function json(res, status, body) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let body = '';
  for await (const part of req) {
    body += part;
    if (body.length > 12000) throw new Error('Request is too large.');
  }
  return JSON.parse(body || '{}');
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/status' && req.method === 'GET') {
    try {
      const response = await fetch(`${ollama}/api/tags`, { signal: AbortSignal.timeout(1800) });
      if (!response.ok) throw new Error('Local model service is not responding.');
      const data = await response.json();
      const models = (data.models || []).map(item => item.name);
      return json(res, 200, { available: models.some(name => name === model || name.startsWith(`${model}:`)), model, installed: models });
    } catch {
      return json(res, 200, { available: false, model, installed: [], reason: 'Ollama is not reachable on this device.' });
    }
  }
  if (url.pathname === '/api/agent' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); }
    catch (error) { return json(res, 400, { error: error.message || 'Invalid request.' }); }
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 3000) : '';
    if (!message) return json(res, 400, { error: 'Please enter a message.' });
    const context = typeof body.context === 'string' ? body.context.slice(0, 5000) : '';
    try {
      const response = await fetch(`${ollama}/api/chat`, {
        method: 'POST', headers: { 'content-type':'application/json' }, signal: AbortSignal.timeout(90000),
        body: JSON.stringify({
          model, stream: false, format: schema,
          options: { temperature: 0.1 },
          messages: [
            { role:'system', content: system },
            ...(context ? [{ role:'user', content:`Earlier transaction and clarification context:\n${context}` }] : []),
            { role:'user', content: message }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) return json(res, 502, { error: data.error || 'The local model could not complete that request.' });
      let result;
      try { result = JSON.parse(data.message?.content || '{}'); }
      catch { return json(res, 502, { error: 'The local model returned an unreadable draft. Please try again or use demo mode.' }); }
      if (!['sale','expense','summary','clarify'].includes(result.intent)) return json(res, 502, { error: 'The local model returned an unsupported intent.' });
      if (result.intent !== 'summary' && result.intent !== 'clarify' && (!Number.isFinite(result.amount) || result.amount <= 0)) {
        result = { intent:'clarify', amount:null, description:result.description || '', question:'What amount should I put in this draft?', missing_fields:['amount'] };
      }
      return json(res, 200, { result });
    } catch (error) {
      const message = error.name === 'TimeoutError'
        ? 'The local model took too long. Try again or use demo mode.'
        : 'Could not reach the local model. Check that Ollama is running and the selected model is installed.';
      return json(res, 502, { error: message });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'Method not allowed.' });
  let pathname;
  try { pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return json(res, 400, { error:'Invalid path.' }); }
  const file = resolve(root, `.${pathname}`);
  if (!file.startsWith(root + sep) && file !== resolve(root, 'index.html')) return json(res, 403, { error:'Forbidden.' });
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'content-type':mime[extname(file)] || 'application/octet-stream', 'cache-control':'no-store' });
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  } catch { json(res, 404, { error:'Not found.' }); }
}

http.createServer((req, res) => { handle(req, res).catch(() => json(res, 500, { error:'Local agent server error.' })); })
  .listen(port, '127.0.0.1', () => console.log(`ZedBiz Agent Lab at http://127.0.0.1:${port} (model: ${model})`));

