const rows = document.querySelector('#experiment-rows');
const emptyState = document.querySelector('#empty-state');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
const dialog = document.querySelector('#experiment-dialog');
const form = document.querySelector('#experiment-form');
const formError = document.querySelector('#form-error');

let experiments = [];

const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function statusLabel(status) {
  return '<span class="status status-' + status + '"><span></span>' + status + '</span>';
}

function renderRows() {
  rows.innerHTML = experiments.map((experiment) => {
    const metric = experiment.metric === null ? '—' : Number(experiment.metric).toFixed(1) + '%';
    return '<tr>' +
      '<td><strong>' + escapeHtml(experiment.name) + '</strong><span class="cell-note">' + escapeHtml(experiment.notes || 'No notes yet') + '</span></td>' +
      '<td><span class="model-name">' + escapeHtml(experiment.model) + '</span><span class="cell-note">' + escapeHtml(experiment.dataset) + '</span></td>' +
      '<td>' + statusLabel(experiment.status) + '</td>' +
      '<td><strong class="metric-value">' + metric + '</strong><span class="cell-note">' + escapeHtml(experiment.metricLabel || 'metric') + '</span></td>' +
      '<td><span class="date-value">' + dateFormatter.format(new Date(experiment.createdAt)) + '</span><span class="cell-note">' + escapeHtml(experiment.duration || '—') + '</span></td>' +
    '</tr>';
  }).join('');
  emptyState.hidden = experiments.length > 0;
}

function renderMetrics(allExperiments) {
  const completed = allExperiments.filter((item) => item.status === 'completed');
  const running = allExperiments.filter((item) => item.status === 'running');
  const best = completed.reduce((score, item) => Math.max(score, Number(item.metric) || 0), 0);
  document.querySelector('#metric-total').textContent = allExperiments.length;
  document.querySelector('#metric-completed').textContent = completed.length;
  document.querySelector('#metric-best').textContent = best ? best.toFixed(1) + '%' : '—';
  document.querySelector('#metric-running').textContent = running.length;
}

async function loadExperiments() {
  const params = new URLSearchParams({ q: search.value, status: statusFilter.value });
  const response = await fetch('/api/experiments?' + params);
  const payload = await response.json();
  experiments = payload.experiments;
  renderRows();
  const allResponse = await fetch('/api/experiments');
  renderMetrics((await allResponse.json()).experiments);
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    document.querySelector('#health-status').textContent = response.ok ? 'API connected' : 'API unavailable';
  } catch {
    document.querySelector('#health-status').textContent = 'API unavailable';
  }
}

document.querySelector('#open-form').addEventListener('click', () => {
  form.reset();
  formError.textContent = '';
  dialog.showModal();
});

[search, statusFilter].forEach((input) => input.addEventListener('input', loadExperiments));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  formError.textContent = '';
  const response = await fetch('/api/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const payload = await response.json();
  if (!response.ok) {
    formError.textContent = payload.error || 'Could not save this experiment.';
    return;
  }
  dialog.close();
  await loadExperiments();
});

loadExperiments();
checkHealth();
