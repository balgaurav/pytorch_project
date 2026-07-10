import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { spawn } from 'node:child_process';

let server;

function waitForServer(process) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start in time')), 5000);
    process.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Experiment Atlas running')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    process.on('error', reject);
  });
}

before(async () => {
  server = spawn(process.execPath, ['server/index.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await waitForServer(server);
});

after(() => server?.kill());

test('health endpoint confirms the API is available', async () => {
  const response = await fetch('http://localhost:4000/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'experiment-atlas' });
});

test('experiment endpoint returns seeded runs', async () => {
  const response = await fetch('http://localhost:4000/api/experiments?status=completed');
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.ok(payload.total >= 1);
  assert.ok(payload.experiments.every((experiment) => experiment.status === 'completed'));
});
