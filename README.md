# Mystic Tarot (神秘塔罗)

A modern Tarot reading application built with React and Vite, with streaming AI interpretations and a lightweight multi-agent backend.

## Features

- Full 78-card deck with bilingual meanings.
- 3-card spread with structured interpretation output.
- Streaming reading flow with SSE for progressively rendered interpretations.
- In-page AI settings for OpenAI-compatible and third-party endpoints.
- Three-stage AI orchestration inspired by the classical `三省` model.
- Reading history that persists cards, questions, and structured interpretations.
- Gallery and detailed card modal.

## Stack

- Frontend: React 19, Vite
- Styling: Tailwind CSS v4, custom CSS
- Animation: Framer Motion
- AI API: lightweight Node server using the OpenAI Responses API, OpenAI-compatible chat completions, or a local mock provider

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the frontend:

   ```bash
   npm run dev
   ```

3. Run the AI API locally in another terminal:

   ```bash
   npm run dev:api
   ```

4. Build for production:

   ```bash
   npm run build
   ```

## AI API modes

- Without `OPENAI_API_KEY`, `server/index.js` serves a deterministic mock reading.
- With `OPENAI_API_KEY`, the server uses the official OpenAI `Responses API` by default, and can switch to OpenAI-compatible `chat/completions` when you supply a custom base URL.
- You can configure `Base URL + API Key + Model` directly from the Reading page for OpenAI-compatible third-party providers.
- You can also choose `single` or `multi` orchestration from the web settings panel; leaving it blank follows the server default.
- `AI_ORCHESTRATION=multi` enables the three-stage pipeline by default; set `AI_ORCHESTRATION=single` when you want lower latency or lower token usage.
- The streaming endpoint `/api/reading/stream` now emits `meta`, `phase`, `partial`, `complete`, and `error` events.
- If the frontend cannot reach `/api/reading`, it falls back to a local on-device interpretation so the UI still works on static hosting.

Suggested environment variables:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_BASE_URL=https://api.openai.com/v1
AI_PROVIDER=auto
AI_ORCHESTRATION=multi
PORT=8787
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=
```

## Multi-agent architecture

The backend now uses a lightweight orchestration shape inspired by the `edict` project, but trimmed down for this Tarot use case: borrow the layering idea, keep the runtime simple.

- `中书省 / DraftAgent`: creates the first structured interpretation draft.
- `门下省 / ReviewAgent`: audits grounding, tone, consistency, and revision needs.
- `尚书省 / FinalizeAgent`: merges draft + review into the final user-facing reading.
- `Mock provider`: remains the final fallback when the remote AI call fails.

```mermaid
flowchart TD
  UI[React Reading UI] --> SETTINGS[AI Settings Panel]
  UI --> STREAM[/api/reading/stream]
  UI --> JSON[/api/reading]

  SETTINGS --> JSON
  SETTINGS --> STREAM

  STREAM --> HYDRATE[Card Hydrator\nserver/index.js]
  JSON --> HYDRATE
  HYDRATE --> ORCH[Reading Orchestrator\nserver/ai/orchestrator.js]

  ORCH --> MODE{AI_ORCHESTRATION}
  MODE -->|multi| DRAFT[中书省\nDraftAgent]
  DRAFT --> REVIEW[门下省\nReviewAgent]
  REVIEW --> FINALIZE[尚书省\nFinalizeAgent]
  FINALIZE --> MERGE[Reading Contract Merge\nsrc/lib/readingContract.js]

  MODE -->|single| SINGLE[Single OpenAI Reading]
  SINGLE --> MERGE

  ORCH -->|provider/mock fallback| MOCK[Mock Provider]
  MOCK --> MERGE

  MERGE --> SSE[Phase + Partial SSE Frames]
  MERGE --> RESULT[Structured Reading JSON]
  SSE --> UI
  RESULT --> UI
```

## Project structure

- `src/components`: visual components and reading UI
- `src/data`: tarot deck data
- `src/lib`: shared reading contract, fallback generation, storage, and API helpers
- `server/ai/agents`: `DraftAgent`, `ReviewAgent`, and `FinalizeAgent`
- `server/ai/providers`: provider-specific integrations such as OpenAI-compatible APIs
- `server/ai/orchestrator.js`: top-level provider and orchestration switching
- `server/index.js`: HTTP API, request validation, card hydration, and SSE delivery

## Orchestration notes

- Cards are still submitted from the client as lightweight refs, but the server hydrates them into full card context before any agent sees them.
- Each agent receives slot, localized card name, upright/reversed orientation, element, meaning, question, and elemental distribution.
- When multi-agent execution fails, the orchestrator falls back to the single-agent OpenAI path before dropping to the local mock provider.
- `phase` SSE events make the agent pipeline observable without requiring frontend coupling.

## Next steps

- Surface `phase` events in the UI as a visible “thinking / reviewing / finalizing” timeline.
- Add per-agent diagnostics in development mode for prompt tuning.
- Move history from local storage to a user-aware backend store when accounts are added.

## License

MIT
