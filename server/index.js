import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, '..', 'public');
const dataFile = path.join(root, '..', 'data', 'experiments.json');
const port = Number(process.env.PORT || 4000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

async function readExperiments() {
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

async function writeExperiments(experiments) {
  await fs.writeFile(dataFile, JSON.stringify(experiments, null, 2) + '\n');
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': mimeTypes['.json'],
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (body.length > 50_000) throw new Error('Request body is too large');
  return JSON.parse(body || '{}');
}

function validateExperiment(input) {
  const required = ['name', 'model', 'dataset'];
  const missing = required.filter((field) => !String(input[field] || '').trim());
  if (missing.length) return 'Add a name, model, and dataset before saving.';
  if (input.status && !['running', 'completed', 'failed'].includes(input.status)) {
    return 'Status must be running, completed, or failed.';
  }
  if (input.metric !== undefined && input.metric !== '' && Number.isNaN(Number(input.metric))) {
    return 'Metric must be a number.';
  }
  return null;
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(response, 200, { status: 'ok', service: 'experiment-atlas' });
  }

  if (request.method === 'GET' && url.pathname === '/api/experiments') {
    const experiments = await readExperiments();
    const query = url.searchParams.get('q')?.toLowerCase().trim() || '';
    const status = url.searchParams.get('status') || 'all';
    const filtered = experiments.filter((experiment) => {
      const matchesQuery = !query || [experiment.name, experiment.model, experiment.dataset]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || experiment.status === status;
      return matchesQuery && matchesStatus;
    });
    return sendJson(response, 200, { experiments: filtered, total: filtered.length });
  }

  if (request.method === 'POST' && url.pathname === '/api/experiments') {
    let input;
    try {
      input = await readBody(request);
    } catch {
      return sendJson(response, 400, { error: 'Send a valid JSON request body.' });
    }

    const validationError = validateExperiment(input);
    if (validationError) return sendJson(response, 422, { error: validationError });

    const experiments = await readExperiments();
    const experiment = {
      id: 'exp-' + randomUUID().slice(0, 8),
      name: String(input.name).trim(),
      model: String(input.model).trim(),
      dataset: String(input.dataset).trim(),
      status: input.status || 'running',
      metric: input.metric === '' || input.metric === undefined ? null : Number(input.metric),
      metricLabel: String(input.metricLabel || 'accuracy').trim(),
      duration: String(input.duration || '—').trim(),
      createdAt: new Date().toISOString(),
      notes: String(input.notes || '').trim()
    };
    experiments.unshift(experiment);
    await writeExperiments(experiments);
    return sendJson(response, 201, { experiment });
  }

  return sendJson(response, 404, { error: 'API route not found.' });
}

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page not found');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
    } else {
      await serveStatic(response, url.pathname);
    }
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'Something went wrong on the server.' });
  }
});

server.listen(port, () => {
  console.log('Experiment Atlas running at http://localhost:' + port);
});
