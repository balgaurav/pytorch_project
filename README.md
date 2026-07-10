# Experiment Atlas

Experiment Atlas is a small full-stack workspace for tracking machine-learning experiments without losing the context behind a result.

It gives you:

- a dashboard of recent runs
- an API for creating and filtering experiments
- lightweight run metadata: model, dataset, status, metric, and notes
- a focused foundation for future PyTorch integrations

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:4000.

## Project shape

- `server/index.js` serves the API and the browser app
- `public/` contains the responsive frontend
- `data/experiments.json` is the local development store

This project intentionally starts with a small surface area so each future commit can represent a real product improvement.
