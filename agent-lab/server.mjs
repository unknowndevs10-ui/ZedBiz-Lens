import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4175);
const nluApi = process.env.ZEDBIZ_NLU_URL || 'http://127.0.0.1:4176';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };

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
      const response = await fetch(`${nluApi}/health`, { signal: AbortSignal.timeout(15000) });
      const health = await response.json();
      return json(res, 200, {
        available: response.ok && health.status === 'ready',
        model: health.model_version || 'intent model',
        validated: Boolean(health.validated_for_real_business_use),
        trainingData: health.training_data_status || 'unknown'
      });
    } catch {
      return json(res, 200, { available:false, model:'intent model', reason:'Start the local NLU API to enable AI mode.' });
    }
  }
  if (url.pathname === '/api/agent' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); }
    catch (error) { return json(res, 400, { error:error.message || 'Invalid request.' }); }
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
    if (!message) return json(res, 400, { error:'Please enter a message.' });
    let text = message;
    if (typeof body.context === 'string' && body.context) {
      try {
        const previous = JSON.parse(body.context);
        if (typeof previous.original === 'string') text = `${previous.original} ${message}`.slice(0, 1000);
      } catch { /* Ignore malformed local conversation context; classify the latest message. */ }
    }
    try {
      const response = await fetch(`${nluApi}/api/v1/interpret`, {
        method:'POST', headers:{'content-type':'application/json'}, signal:AbortSignal.timeout(10000),
        body:JSON.stringify({text, language:'en'})
      });
      const result = await response.json();
      if (!response.ok) return json(res, 502, { error:result.detail || 'The local NLU API could not interpret that message.' });
      return json(res, 200, { result:{
        intent:result.needs_clarification ? 'clarify' : result.intent,
        amount:result.draft?.amount ?? null,
        question:result.question,
        description:result.draft?.description ?? text,
        reviewReasons:result.review_reasons,
        modelVersion:result.model_version,
        trainingDataStatus:result.training_data_status,
        needsOwnerConfirmation:result.needs_owner_confirmation
      }});
    } catch {
      return json(res, 502, { error:'The local NLU API is unavailable. Start it or use demo mode.' });
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

http.createServer((req, res) => { handle(req, res).catch(() => json(res, 500, { error:'Local Agent Lab server error.' })); })
  .listen(port, '127.0.0.1', () => console.log(`ZedBiz Agent Lab at http://127.0.0.1:${port}; NLU API: ${nluApi}`));

