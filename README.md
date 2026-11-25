# Voice Agent Studio

Real-time browser voice workspace for **Sarvam Conversational AI** web agents. Switch between multiple voice agents from a single dropdown — selecting an agent immediately connects and starts a live voice session.

Works on **Windows, macOS, and Linux** (Node 20+).

## Setup

```bash
npm install
```

If a Linux-only optional package errors on Windows:

```bash
npm install --force
```

Create `.env` in the project root:

```env
# Shared Sarvam workspace credentials
VITE_SARVAM_API_KEY=...
VITE_SARVAM_ORG_ID=...
VITE_SARVAM_WORKSPACE_ID=...

# Built-in voice agents
VITE_SARVAM_APP_ID=...
VITE_SARVAM_PONDPRO_AGENT_ID=...

# Optional: add any number of extra web agents via JSON
# VITE_SARVAM_AGENTS='[{"id":"sales","name":"Sales Assistant","description":"Handles product inquiries","appId":"your-agent-id","language":"English","accent":"violet"}]'

# Optional: OpenAI key for post-call AI summary
OPENAI_API_KEY=...
PORT=8787
```

Restart `npm run dev` after editing `.env` (Vite reads env vars at startup).

## Run

```bash
npm run dev
```

- UI: **http://localhost:8080**
- API: **http://localhost:8787** (proxied as `/api`)

## Adding Multiple Web Agents

You can add as many web agents as you want in two ways:

1. **In the UI:** Click **Add Agent** in the header (or **Add new web agent** at the bottom of the dropdown) and enter the agent's name, Sarvam Agent ID (`app_id`), language, and optional workspace overrides.
2. **In `.env`:** Set `VITE_SARVAM_AGENTS` to a JSON array of agent objects, or add entries in `src/lib/sarvam/agents.ts`.

### Sarvam Tips

- Each agent must be a **Voice** agent (not text-only) with a **committed** version in the Sarvam dashboard.
- Copy IDs from **Deploy with Code** for each agent.
- Prefer headphones and allow microphone access when prompted.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run Vite client + Express API together |
| `npm run build` | Type-check and build production bundle |
| `npm start` | Serve built client + Express API |
| `npm run typecheck` | Run TypeScript check |
