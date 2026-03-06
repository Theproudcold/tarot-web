import { runMultiAgentReading } from './multiAgentOrchestrator.js';
import { getPhaseLabel } from './agents/shared.js';
import { createMockReading } from './providers/mockProvider.js';
import { createOpenAIReading, testOpenAIConnection } from './providers/openaiProvider.js';
import { getErrorDetail } from './errorUtils.js';

const env = globalThis.process?.env ?? {};

const normalizeOrchestrationMode = (value) => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  return normalized === 'single' || normalized === 'multi' ? normalized : null;
};

const emitPhase = async (options, language, stage, status, extra = {}) => {
  if (typeof options?.onPhase !== 'function') {
    return;
  }

  await options.onPhase({
    stage,
    status,
    label: getPhaseLabel(stage, language),
    timestamp: new Date().toISOString(),
    ...extra,
  });
};

export const resolveProvider = (aiConfig = null) => {
  const provider = (env.AI_PROVIDER || 'auto').toLowerCase();

  if (provider === 'openai' || provider === 'mock') {
    return provider;
  }

  return aiConfig?.apiKey || env.OPENAI_API_KEY ? 'openai' : 'mock';
};

export const resolveOrchestrationMode = (override = null) => {
  const envMode = normalizeOrchestrationMode(env.AI_ORCHESTRATION);
  return normalizeOrchestrationMode(override) || envMode || 'multi';
};

export const resolveEffectiveRuntime = ({ aiConfig = null, orchestration = null } = {}) => {
  const provider = resolveProvider(aiConfig);

  if (provider === 'mock') {
    return {
      provider,
      orchestration: 'mock',
    };
  }

  return {
    provider,
    orchestration: resolveOrchestrationMode(orchestration),
  };
};

const emitFallbackPhase = async (payload, options, error, fallbackDetail) => {
  await emitPhase(options, payload.language, 'fallback', 'triggered', {
    detail: getErrorDetail(error, fallbackDetail),
  });
};

export const runReadingOrchestrator = async (payload, options = {}) => {
  const runtime = resolveEffectiveRuntime({
    aiConfig: payload.aiConfig,
    orchestration: payload.orchestration,
  });

  if (runtime.provider === 'mock') {
    return createMockReading(payload);
  }

  try {
    if (runtime.orchestration === 'multi') {
      try {
        return await runMultiAgentReading(payload, options);
      } catch (error) {
        console.error('Multi-agent pipeline failed, falling back to single agent:', error);
        await emitFallbackPhase(payload, options, error, 'Multi-agent pipeline failed');
        return await createOpenAIReading(payload);
      }
    }

    return await createOpenAIReading(payload);
  } catch (error) {
    console.error('OpenAI provider failed, falling back to mock:', error);
    await emitFallbackPhase(payload, options, error, 'OpenAI provider failed');
    return createMockReading(payload);
  }
};

export const testReadingProviderConnection = async ({ aiConfig = null, orchestration = null } = {}) => {
  const runtime = resolveEffectiveRuntime({ aiConfig, orchestration });

  if (runtime.provider === 'mock') {
    return {
      ok: true,
      status: 'mock',
      provider: 'mock-server',
      model: 'deterministic-mock',
      mode: 'mock',
      endpoint: null,
      orchestration: runtime.orchestration,
    };
  }

  const result = await testOpenAIConnection({ aiConfig });

  return {
    ...result,
    orchestration: runtime.orchestration,
  };
};

export const getActiveProvider = (aiConfig = null) => resolveProvider(aiConfig);
export const getActiveOrchestrationMode = (override = null) => resolveOrchestrationMode(override);
