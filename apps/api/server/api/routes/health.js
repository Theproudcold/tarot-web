import {
  getActiveOrchestrationMode,
  getActiveProvider,
} from '../../ai/orchestrator.js';

const env = globalThis.process?.env ?? {};

export const registerHealthRoutes = (app, { staticApp = false } = {}) => {
  app.get('/health', async () => ({
    ok: true,
    provider: getActiveProvider(),
    orchestration: getActiveOrchestrationMode(),
    model: env.OPENAI_MODEL || 'gpt-5-mini',
    staticApp,
  }));
};
