# Elixir Research

Elixir Research is an open-source, privacy-first pharmacokinetic self-management app for common prescription medicines and controlled psychiatric medicines.

The project starts from a local-first web/PWA core that can be deployed to Netlify, then grows by adding drug, interaction, report, sync, and privacy modules.

## Current Prototype

- React + TypeScript + Vite frontend
- Netlify-ready static deployment
- Local PK simulation for an oxycodone CR demo profile
- Therapeutic window visualization
- Dynamic peak/trough markers
- Interaction warning modal
- Theme switch and web palette control
- Local-only dose/settings persistence

## Commands

```bash
npm install
npm run dev
npm run build
```

Netlify build settings:

- Build command: `npm run build`
- Publish directory: `dist`

## Important Safety Boundary

This app is a research and visualization tool. It is not a dosing calculator, diagnosis tool, or replacement for medical care. Any controlled substance, opioid, sedative, psychiatric, pediatric, pregnancy, renal, hepatic, or interaction-sensitive scenario must be handled as "requires clinician review" in product copy and validation flows.

## Documentation Map

- [Development Plan](./docs/DEVELOPMENT_PLAN.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Module Standard](./docs/MODULE_STANDARD.md)
- [PK Modeling Notes](./docs/PK_MODELING.md)
- [Data Pipeline](./docs/DATA_PIPELINE.md)
- [Security and Privacy](./docs/SECURITY_PRIVACY.md)
- [Research Notes](./docs/RESEARCH_NOTES.md)
- [Medication Modules](./docs/MEDICATION_MODULES.md)
