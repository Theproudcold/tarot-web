# Frontend Backend Split Runtime Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current mixed Vite/Node app into a clearer React frontend and Fastify API backend while improving the reading runtime flow display.

**Architecture:** Keep the existing AI provider and agent modules, but move HTTP concerns into a Fastify API surface. First stabilize the runtime event contract and frontend status timeline, then migrate `server/index.js` routes into focused API modules, then organize the repo into `apps/web`, `apps/api`, and shared contracts. Do not add LangChain in this phase; expose a small internal workflow interface so LangGraph can replace the hand-written orchestrator later if the workflow becomes stateful enough to justify it.

**Tech Stack:** React 19, Vite 5, Node.js ESM, Fastify, SSE, Vitest, ESLint, existing AI orchestration modules.

---

## Scope

This plan covers three tightly related changes:

1. Runtime flow UX: make `draft / review / finalize / fallback` readable, testable, and driven by a stable event model.
2. Backend API refactor: replace hand-written `node:http` route handling with Fastify while preserving current endpoints.
3. Repo split: move frontend and backend into separate app folders with shared API contracts.

This plan does not cover user accounts, database-backed history, billing, admin panels, RAG, LangChain, or LangGraph execution.

## File Structure

- Create `src/lib/readingRuntime.js`: frontend runtime phase normalization, labels, and timeline state helpers.
- Modify `src/components/Interpretation.jsx`: delegate phase normalization to `readingRuntime.js` and keep rendering focused.
- Modify `src/components/RuntimeStatusBar.jsx`: align status display with the same runtime vocabulary.
- Modify `src/locales/zh.js` and `src/locales/en.js`: add clearer status labels, hints, and failure/fallback copy.
- Create `src/lib/readingRuntime.test.js`: unit tests for phase ordering, fallback handling, and timeline state.
- Create `server/api/contracts/readingEvents.js`: shared server-side reading event names and phase helpers.
- Create `server/api/contracts/readingEvents.test.js`: tests for event payload helpers.
- Create `server/api/createApiServer.js`: Fastify app factory with health, connection test, reading stream, reading, and follow-up routes.
- Create `server/api/routes/health.js`: `/health`.
- Create `server/api/routes/connectionTest.js`: `/api/connection-test`.
- Create `server/api/routes/reading.js`: `/api/reading/stream`, `/api/reading`, `/api/followup`.
- Create `server/api/http/cors.js`: CORS origin normalization.
- Create `server/api/http/body.js`: request payload validation and card hydration.
- Create `server/api/http/sse.js`: Fastify SSE helpers.
- Modify `server/index.js`: thin startup wrapper around `createApiServer`.
- Modify `package.json`: add Fastify dependency and keep existing scripts stable.
- Modify `vite.config.js`: update paths only after repo split.
- Move later: `src` to `apps/web/src`, `server` to `apps/api/server`, and shared contract modules to `packages/shared`.
- Modify `Dockerfile`, `compose.yaml`, `README.md`, `README.en.md`, `.env.example`: update commands and deployment notes after the code split.

## Task 1: Extract Frontend Runtime Phase Logic

**Files:**
- Create: `src/lib/readingRuntime.js`
- Test: `src/lib/readingRuntime.test.js`
- Modify: `src/components/Interpretation.jsx`

- [ ] **Step 1: Write failing tests for phase normalization**

```js
import { describe, expect, it } from 'vitest';
import { getDisplayedPhases, getTimelineState } from './readingRuntime.js';

describe('reading runtime timeline', () => {
  it('creates the multi-agent default pipeline in order', () => {
    expect(getDisplayedPhases({
      phases: [],
      orchestration: 'multi',
      language: 'zh',
      loading: true,
    }).map((phase) => phase.stage)).toEqual(['draft', 'review', 'finalize']);
  });

  it('places fallback after failed pipeline stages', () => {
    const displayed = getDisplayedPhases({
      phases: [
        { stage: 'review', status: 'failed', detail: 'model overloaded' },
        { stage: 'fallback', status: 'triggered', detail: 'mock fallback used' },
      ],
      orchestration: 'multi',
      language: 'zh',
      loading: false,
    });

    expect(displayed.map((phase) => phase.stage)).toEqual(['draft', 'review', 'finalize', 'fallback']);
    expect(displayed.find((phase) => phase.stage === 'fallback').detail).toBe('mock fallback used');
  });

  it('reports finalize sync while final text is still streaming', () => {
    const displayed = getDisplayedPhases({
      phases: [
        { stage: 'draft', status: 'completed' },
        { stage: 'review', status: 'completed' },
        { stage: 'finalize', status: 'completed' },
      ],
      orchestration: 'multi',
      language: 'zh',
      loading: true,
    });

    expect(getTimelineState({ displayedPhases: displayed, orchestration: 'multi', loading: true }).kind)
      .toBe('finalize-sync');
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/lib/readingRuntime.test.js`

Expected: FAIL because `src/lib/readingRuntime.js` does not exist.

- [ ] **Step 3: Implement `readingRuntime.js`**

```js
const pipelineStages = ['draft', 'review', 'finalize'];
const phaseOrder = ['draft', 'review', 'finalize', 'fallback'];

const phaseLabels = {
  en: {
    draft: 'Card draft',
    review: 'Reading review',
    finalize: 'Final reading',
    fallback: 'Fallback',
  },
  zh: {
    draft: '牌意起稿',
    review: '解读复核',
    finalize: '结果定稿',
    fallback: '降级回退',
  },
};

const statusLabels = {
  en: {
    pending: 'Pending',
    started: 'In Progress',
    completed: 'Completed',
    triggered: 'Triggered',
    failed: 'Failed',
  },
  zh: {
    pending: '等待中',
    started: '进行中',
    completed: '已完成',
    triggered: '已触发',
    failed: '失败',
  },
};

export const getDisplayedPhases = ({
  phases = [],
  orchestration = null,
  language = 'en',
  loading = false,
  reading = null,
} = {}) => {
  const labels = phaseLabels[language] || phaseLabels.en;
  const statuses = statusLabels[language] || statusLabels.en;
  const phaseMap = new Map(
    phases
      .filter((phase) => phase?.stage)
      .map((phase) => [phase.stage, phase])
  );

  if (!loading && Array.isArray(reading?.agentPipeline)) {
    reading.agentPipeline
      .filter((stage) => pipelineStages.includes(stage))
      .forEach((stage) => {
        const existing = phaseMap.get(stage);
        phaseMap.set(stage, {
          ...existing,
          stage,
          status: existing?.status === 'failed' ? 'failed' : 'completed',
        });
      });
  }

  const shouldShowPipeline = orchestration === 'multi' || pipelineStages.some((stage) => phaseMap.has(stage));
  const stages = shouldShowPipeline ? [...pipelineStages] : [];

  if (phaseMap.has('fallback')) {
    stages.push('fallback');
  }

  const source = stages.length
    ? stages.map((stage) => phaseMap.get(stage) || { stage, status: stage === 'fallback' ? 'triggered' : 'pending' })
    : [...phaseMap.values()].sort((left, right) => phaseOrder.indexOf(left.stage) - phaseOrder.indexOf(right.stage));

  return source.map((phase) => ({
    ...phase,
    label: phase.label || labels[phase.stage] || phase.stage,
    status: phase.status || 'pending',
    statusLabel: statuses[phase.status || 'pending'] || statuses.pending,
    detail: phase.detail || '',
  }));
};

export const getTimelineState = ({ displayedPhases = [], orchestration = null, loading = false } = {}) => {
  const activePhases = displayedPhases.filter((phase) => pipelineStages.includes(phase.stage));
  const failedPhase = activePhases.find((phase) => phase.status === 'failed');
  const fallbackPhase = displayedPhases.find((phase) => phase.stage === 'fallback');
  const expectsFullPipeline = orchestration === 'multi';
  const hasFullPipeline = !expectsFullPipeline || activePhases.length === pipelineStages.length;
  const isComplete = hasFullPipeline && activePhases.length > 0 && activePhases.every((phase) => phase.status === 'completed');
  const isRunning = activePhases.some((phase) => phase.status === 'started');
  const isWaiting = activePhases.some((phase) => phase.status === 'pending');

  if (loading && isComplete) return { kind: 'finalize-sync' };
  if (fallbackPhase) return { kind: 'fallback', detail: fallbackPhase.detail || failedPhase?.detail || '' };
  if (failedPhase) return { kind: 'failed', detail: failedPhase.detail || '' };
  if (isComplete) return { kind: 'completed' };
  if (loading || isRunning || isWaiting) return { kind: 'running' };
  return { kind: 'idle' };
};
```

- [ ] **Step 4: Update `Interpretation.jsx` to import helpers**

Replace local `phaseLabelsByLanguage`, `phaseStatusLabelsByLanguage`, `phaseOrder`, `pipelineStages`, `displayedPhases`, and `timelineState` calculations with imports from `src/lib/readingRuntime.js`. Keep `PhaseTimeline` rendering in the component for now.

- [ ] **Step 5: Run focused tests**

Run: `npm run test:run -- src/lib/readingRuntime.test.js src/App.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/readingRuntime.js src/lib/readingRuntime.test.js src/components/Interpretation.jsx
git commit -m "refactor: extract reading runtime timeline logic"
```

## Task 2: Improve Runtime Flow Display Copy and Layout

**Files:**
- Modify: `src/components/Interpretation.jsx`
- Modify: `src/components/RuntimeStatusBar.jsx`
- Modify: `src/locales/zh.js`
- Modify: `src/locales/en.js`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Add failing UI expectations**

Add a test in `src/App.test.jsx` that renders a completed three-card reading state or exercises the existing flow and expects the timeline title, mode label, and fallback warning text to be available in Chinese.

```js
expect(screen.getByText('解读流程')).toBeInTheDocument();
expect(screen.getByText(/编排模式/)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test**

Run: `npm run test:run -- src/App.test.jsx`

Expected: FAIL until the new copy is wired.

- [ ] **Step 3: Update locale keys**

Add or adjust these keys in both locale files:

```js
aiPhaseTimelineTitle: '解读流程',
aiPhaseTimelineHint: '实时显示起稿、复核、定稿和回退状态。',
aiPhaseTimelineRunning: '流程进行中',
aiPhaseTimelineDone: '流程已完成',
aiPhaseTimelineFailed: '阶段失败',
aiPhaseTimelineFallback: '已回退',
aiPhaseTimelineFinalizeStreaming: '流程已完成，正在同步最终文本。',
aiStreamingFinalize: '定稿回传中...',
aiFallbackReasonLabel: '原因',
```

- [ ] **Step 4: Refine timeline layout**

In `Interpretation.jsx`, make the pipeline timeline easier to scan:

- keep phase cards at stable dimensions,
- show failed and fallback details directly under the relevant phase,
- make `finalize-sync` visibly different from a still-running phase,
- avoid duplicating too much runtime metadata between the header badges and `RuntimeStatusBar`.

- [ ] **Step 5: Refine floating runtime status**

In `RuntimeStatusBar.jsx`, keep it as a compact runtime summary:

- provider,
- mode,
- model,
- scope.

Do not duplicate per-phase progress there.

- [ ] **Step 6: Run tests**

Run: `npm run test:run -- src/App.test.jsx src/components/ToastProvider.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Interpretation.jsx src/components/RuntimeStatusBar.jsx src/locales/zh.js src/locales/en.js src/App.test.jsx
git commit -m "feat: clarify reading runtime flow display"
```

## Task 3: Add Backend Runtime Event Contract

**Files:**
- Create: `server/api/contracts/readingEvents.js`
- Test: `server/api/contracts/readingEvents.test.js`
- Modify: `server/ai/orchestrator.js`
- Modify: `server/ai/multiAgentOrchestrator.js`
- Modify: `server/ai/streaming.js`

- [ ] **Step 1: Write failing contract tests**

```js
import { describe, expect, it } from 'vitest';
import { createPhaseEvent, READING_EVENTS, READING_PHASES } from './readingEvents.js';

describe('reading event contract', () => {
  it('exports stable SSE event names', () => {
    expect(READING_EVENTS).toEqual({
      meta: 'meta',
      phase: 'phase',
      partial: 'partial',
      complete: 'complete',
      error: 'error',
    });
  });

  it('normalizes phase event payloads', () => {
    expect(createPhaseEvent({
      stage: 'draft',
      status: 'started',
      provider: 'openai',
      model: 'gpt-5-mini',
    })).toEqual({
      stage: 'draft',
      status: 'started',
      provider: 'openai',
      model: 'gpt-5-mini',
      detail: '',
    });
  });

  it('rejects unknown stages', () => {
    expect(() => createPhaseEvent({ stage: 'wat', status: 'started' })).toThrow('Unknown reading phase');
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm run test:run -- server/api/contracts/readingEvents.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the contract**

```js
export const READING_EVENTS = Object.freeze({
  meta: 'meta',
  phase: 'phase',
  partial: 'partial',
  complete: 'complete',
  error: 'error',
});

export const READING_PHASES = Object.freeze(['draft', 'review', 'finalize', 'fallback']);
export const READING_PHASE_STATUSES = Object.freeze(['pending', 'started', 'completed', 'triggered', 'failed']);

export const createPhaseEvent = ({ stage, status, provider = null, model = null, detail = '' } = {}) => {
  if (!READING_PHASES.includes(stage)) {
    throw new Error(`Unknown reading phase: ${stage}`);
  }

  if (!READING_PHASE_STATUSES.includes(status)) {
    throw new Error(`Unknown reading phase status: ${status}`);
  }

  return {
    stage,
    status,
    provider,
    model,
    detail: typeof detail === 'string' ? detail : '',
  };
};
```

- [ ] **Step 4: Use constants in existing streaming code**

Replace hard-coded event names where practical, without changing the public SSE protocol.

- [ ] **Step 5: Run backend tests**

Run: `npm run test:run -- server/api/contracts/readingEvents.test.js server/ai/agents/shared.test.js server/ai/providers/openaiProvider.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/api/contracts/readingEvents.js server/api/contracts/readingEvents.test.js server/ai/orchestrator.js server/ai/multiAgentOrchestrator.js server/ai/streaming.js
git commit -m "feat: define reading runtime event contract"
```

## Task 4: Introduce Fastify API Server Without Moving Folders

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `server/api/createApiServer.js`
- Create: `server/api/routes/health.js`
- Create: `server/api/routes/connectionTest.js`
- Create: `server/api/routes/reading.js`
- Create: `server/api/http/cors.js`
- Create: `server/api/http/body.js`
- Create: `server/api/http/sse.js`
- Modify: `server/index.js`
- Test: `server/api/createApiServer.test.js`

- [ ] **Step 1: Install Fastify**

Run: `npm install fastify @fastify/cors`

Expected: `package.json` and `package-lock.json` include the new dependencies.

- [ ] **Step 2: Write failing API server tests**

```js
import { afterEach, describe, expect, it } from 'vitest';
import { createApiServer } from './createApiServer.js';

let app;

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

describe('createApiServer', () => {
  it('serves health status', async () => {
    app = createApiServer();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true });
  });

  it('rejects malformed reading requests', async () => {
    app = createApiServer();

    const response = await app.inject({
      method: 'POST',
      url: '/api/reading',
      payload: { language: 'zh', cards: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('cards');
  });
});
```

- [ ] **Step 3: Run the test and confirm failure**

Run: `npm run test:run -- server/api/createApiServer.test.js`

Expected: FAIL because `createApiServer.js` does not exist or Fastify is not wired.

- [ ] **Step 4: Implement request helpers**

Move the non-server-specific helpers from `server/index.js` into:

- `server/api/http/cors.js`: `normalizeOriginList`, `buildCorsOptions`.
- `server/api/http/body.js`: `hydrateCards`, `normalizeAiConfig`, `normalizeOrchestration`, `validateReadingRequest`, `validateConnectionTestRequest`.
- `server/api/http/sse.js`: `writeFastifySseEvent`, `openFastifyEventStream`.

- [ ] **Step 5: Implement route modules**

Each route module should accept the Fastify app and register routes:

```js
export const registerHealthRoutes = (app) => {
  app.get('/health', async () => ({
    ok: true,
    provider: getActiveProvider(),
    orchestration: getActiveOrchestrationMode(),
    model: env.OPENAI_MODEL || 'gpt-5-mini',
    staticApp: false,
  }));
};
```

- [ ] **Step 6: Implement `createApiServer`**

```js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { buildCorsOptions } from './http/cors.js';
import { registerConnectionTestRoutes } from './routes/connectionTest.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerReadingRoutes } from './routes/reading.js';

export const createApiServer = () => {
  const app = Fastify({ logger: true });

  app.register(cors, buildCorsOptions());
  registerHealthRoutes(app);
  registerConnectionTestRoutes(app);
  registerReadingRoutes(app);

  return app;
};
```

- [ ] **Step 7: Keep `server/index.js` as startup wrapper**

```js
import { createApiServer } from './api/createApiServer.js';

const env = globalThis.process?.env ?? {};
const PORT = Number(env.PORT || 8787);

export const startServer = async () => {
  const app = createApiServer();
  await app.listen({ port: PORT, host: env.HOST || '0.0.0.0' });
  return app;
};

const argv = globalThis.process?.argv || [];
const isMainModule = argv[1] && argv[1].endsWith('/server/index.js');

if (isMainModule) {
  await startServer();
}
```

- [ ] **Step 8: Run tests**

Run: `npm run test:run -- server/api/createApiServer.test.js server/ai/debugMicrocopy.test.js`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json server/index.js server/api
git commit -m "refactor: migrate api server to fastify"
```

## Task 5: Preserve Static Production Serving Separately

**Files:**
- Create: `server/api/static/staticApp.js`
- Modify: `server/api/createApiServer.js`
- Modify: `server/api/createApiServer.test.js`
- Modify: `server/index.js`

- [ ] **Step 1: Add failing tests for static mode**

Test that `createApiServer({ serveStatic: false })` does not serve frontend assets and `createApiServer({ serveStatic: true })` can be constructed without requiring `dist`.

- [ ] **Step 2: Run tests**

Run: `npm run test:run -- server/api/createApiServer.test.js`

Expected: FAIL until static mode is configurable.

- [ ] **Step 3: Implement `staticApp.js`**

Move the static serving logic from the old `server/index.js` into a Fastify-compatible handler. Keep SPA fallback and `/health` plus `/api/*` exclusions.

- [ ] **Step 4: Wire production startup**

Use `createApiServer({ serveStatic: true })` in `server/index.js` so `npm run start` keeps the current single-container deployment behavior.

- [ ] **Step 5: Run build and API tests**

Run: `npm run build`

Expected: PASS and `dist` is generated.

Run: `npm run test:run -- server/api/createApiServer.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/api/static/staticApp.js server/api/createApiServer.js server/api/createApiServer.test.js server/index.js
git commit -m "feat: preserve production static serving in fastify"
```

## Task 6: Create Shared Workflow Boundary

**Files:**
- Create: `server/ai/workflow/readingWorkflow.js`
- Test: `server/ai/workflow/readingWorkflow.test.js`
- Modify: `server/api/routes/reading.js`
- Modify: `server/ai/orchestrator.js`

- [ ] **Step 1: Write failing workflow boundary tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { runReadingWorkflow } from './readingWorkflow.js';

describe('runReadingWorkflow', () => {
  it('forwards phase and partial callbacks to the orchestrator', async () => {
    const onPhase = vi.fn();
    const onPartial = vi.fn();

    await expect(runReadingWorkflow({
      language: 'zh',
      cards: [],
      createdAt: '2026-05-23T00:00:00.000Z',
    }, { onPhase, onPartial })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test**

Run: `npm run test:run -- server/ai/workflow/readingWorkflow.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement thin workflow wrapper**

```js
import { runReadingOrchestrator } from '../orchestrator.js';

export const runReadingWorkflow = async (payload, options = {}) => runReadingOrchestrator(payload, {
  onPhase: options.onPhase,
  onPartialReading: options.onPartialReading || options.onPartial,
});
```

- [ ] **Step 4: Update Fastify reading routes**

Call `runReadingWorkflow` from `server/api/routes/reading.js` instead of calling `runReadingOrchestrator` directly.

- [ ] **Step 5: Add a comment documenting the LangGraph seam**

Add one short comment above `runReadingWorkflow`:

```js
// Keep this boundary small so a future LangGraph workflow can replace the hand-written orchestrator.
```

- [ ] **Step 6: Run tests**

Run: `npm run test:run -- server/ai/workflow/readingWorkflow.test.js server/api/createApiServer.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/ai/workflow/readingWorkflow.js server/ai/workflow/readingWorkflow.test.js server/api/routes/reading.js
git commit -m "refactor: add reading workflow boundary"
```

## Task 7: Split Repo Into Web, API, and Shared Packages

**Files:**
- Move: `src` -> `apps/web/src`
- Move: `public` -> `apps/web/public`
- Move: `index.html` -> `apps/web/index.html`
- Move: `vite.config.js` -> `apps/web/vite.config.js`
- Move: `postcss.config.js` -> `apps/web/postcss.config.js`
- Move: `server` -> `apps/api/server`
- Create: `packages/shared/readingEvents.js`
- Modify: `package.json`
- Modify: `eslint.config.js`
- Modify: `Dockerfile`
- Modify: `compose.yaml`
- Modify: `README.md`
- Modify: `README.en.md`

- [ ] **Step 1: Add shared package test before moving files**

Create `packages/shared/readingEvents.test.js` and verify it can import the copied shared event contract.

- [ ] **Step 2: Run test**

Run: `npm run test:run -- packages/shared/readingEvents.test.js`

Expected: FAIL until the shared package exists.

- [ ] **Step 3: Create shared contract module**

Move the generic pieces from `server/api/contracts/readingEvents.js` to `packages/shared/readingEvents.js`, then re-export or import them from server code.

- [ ] **Step 4: Move frontend files**

Use `git mv` for:

```bash
git mv src apps/web/src
git mv public apps/web/public
git mv index.html apps/web/index.html
git mv vite.config.js apps/web/vite.config.js
git mv postcss.config.js apps/web/postcss.config.js
```

- [ ] **Step 5: Move backend files**

Use `git mv` for:

```bash
git mv server apps/api/server
```

- [ ] **Step 6: Update package scripts**

```json
{
  "scripts": {
    "dev": "vite --config apps/web/vite.config.js",
    "dev:api": "node apps/api/server/index.js",
    "build": "vite build --config apps/web/vite.config.js",
    "preview": "vite preview --config apps/web/vite.config.js",
    "start": "node apps/api/server/index.js",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 7: Update import paths**

Fix moved imports from API modules to frontend tarot data. Prefer moving shared tarot request serialization later; for this task, keep the smallest path changes needed to pass tests.

- [ ] **Step 8: Update Vite config**

Set the Vite project root to `apps/web` if needed and keep output at root `dist` or explicitly document a new `apps/web/dist` output. Pick one behavior and update Docker accordingly.

- [ ] **Step 9: Run full verification**

Run: `npm run test:run`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add apps packages package.json package-lock.json eslint.config.js Dockerfile compose.yaml README.md README.en.md
git commit -m "refactor: split frontend api and shared packages"
```

## Task 8: Update Deployment and Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `Dockerfile`
- Modify: `compose.yaml`

- [ ] **Step 1: Update env examples**

Clarify:

- `PORT` belongs to API,
- `VITE_API_BASE_URL` belongs to frontend build,
- `CORS_ORIGIN` must include the frontend origin when deployed separately.

- [ ] **Step 2: Update local development docs**

Document:

```bash
npm run dev
npm run dev:api
```

and mention that frontend and API are independent processes.

- [ ] **Step 3: Update production docs**

Document two supported modes:

- combined container: API serves built frontend,
- split deployment: static frontend plus standalone API.

- [ ] **Step 4: Update Docker build paths**

Ensure Docker copies `apps/web`, `apps/api`, `packages`, and root package files. Confirm `npm run build` still produces the static app where the API static server expects it.

- [ ] **Step 5: Run final verification**

Run: `npm run test:run`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .env.example README.md README.en.md Dockerfile compose.yaml
git commit -m "docs: document split frontend api deployment"
```

## Task 9: Manual Runtime Verification

**Files:**
- No source changes expected unless verification finds defects.

- [ ] **Step 1: Start API**

Run: `npm run dev:api`

Expected: API listens on `http://localhost:8787`.

- [ ] **Step 2: Start frontend**

Run: `npm run dev`

Expected: Vite serves the frontend on `http://localhost:5173`.

- [ ] **Step 3: Verify health**

Run: `curl -i http://localhost:8787/health`

Expected: `200` with JSON containing `ok: true`.

- [ ] **Step 4: Verify app flow**

Open `http://localhost:5173`, draw three cards, and confirm:

- the reading request reaches `/api/reading/stream`,
- the timeline shows `draft`, `review`, `finalize`,
- fallback state is visible if the remote provider fails,
- final reading and history save still work.

- [ ] **Step 5: Stop dev servers**

Stop both processes cleanly.

## Rollback Notes

- If Fastify migration introduces SSE regressions, keep the runtime UX extraction from Tasks 1-2 and revert Tasks 4-5.
- If folder splitting becomes noisy, stop after Task 6. That still gives a clearer backend boundary without destabilizing build paths.
- If LangGraph becomes necessary later, replace only `server/ai/workflow/readingWorkflow.js`; do not rewrite frontend state handling.
