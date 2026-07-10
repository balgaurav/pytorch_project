# Experiment Atlas

Experiment Atlas is a small full-stack workspace for tracking machine-learning experiments without losing the context behind a result.

It gives you:

- a dashboard of recent runs
- an API for creating and filtering experiments
- lightweight run metadata: model, dataset, status, metric, and notes
- a focused foundation for future PyTorch integrations
- a test command and GitHub Actions workflow for safe iteration

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:4000.

Run the API checks with:

```bash
npm test
```

## Project shape

- `server/index.js` serves the API and the browser app
- `public/` contains the responsive frontend
- `data/experiments.json` is the local development store
- `test/api.test.js` covers the health and listing endpoints
- `.github/workflows/ci.yml` runs tests on pushes and pull requests

## Suggested workflow

1. Start with a hypothesis and log it as a running experiment.
2. Add the model, dataset, metric, and a short note about the change.
3. Update the run status when the result is known.
4. Use the notes to decide what the next commit should improve.

This project intentionally starts with a small surface area so each future commit can represent a real product improvement. See [CONTRIBUTING.md](CONTRIBUTING.md) for the working agreement and suggested next steps.
