import { normalizeReadingResult, normalizeStreamingReadingResult } from './readingContract.js';
import { buildReading, serializeCards } from './tarotReading.js';
import { serializeAiSettings, serializeOrchestrationMode } from './aiSettings.js';

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_STREAM_TIMEOUT_MS = Number(import.meta.env.VITE_STREAM_TIMEOUT_MS || 180000);

const trimTrailingSlash = (value = '') => value.replace(/\/$/, '');

const getApiBaseUrl = () => trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');

const buildUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
};

const withTimeout = async (request, timeoutMs = DEFAULT_TIMEOUT_MS, timeoutMessage = `Request timed out after ${timeoutMs}ms`) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await request(controller.signal);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const createStreamTimeoutController = (
  timeoutMs = DEFAULT_STREAM_TIMEOUT_MS,
  timeoutMessage = `Streaming request timed out after ${timeoutMs}ms`
) => {
  const controller = new AbortController();
  let timeoutId = null;

  const reset = () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  };

  const clear = () => {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  };

  reset();

  return {
    signal: controller.signal,
    timeoutMessage,
    reset,
    clear,
  };
};

const requestJson = async (path, payload) => withTimeout(async (signal) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
});

const parseSseEvent = (rawEvent) => {
  const lines = rawEvent.split('\n');
  let event = 'message';
  const dataLines = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  });

  if (!dataLines.length) {
    return null;
  }

  return {
    event,
    data: JSON.parse(dataLines.join('\n')),
  };
};

const consumeEventStream = async (stream, onEvent, timeoutController = null) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      timeoutController?.reset();
      const { value, done } = await reader.read();
      if (done) break;

      timeoutController?.reset();
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const parsed = parseSseEvent(chunk.trim());
        if (parsed) {
          await onEvent(parsed);
        }
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const parsed = parseSseEvent(trailing);
      if (parsed) {
        await onEvent(parsed);
      }
    }
  } finally {
    timeoutController?.clear();

    try {
      reader.releaseLock();
    } catch {
      // noop
    }
  }
};

export const getAiRuntimeInfo = async () => withTimeout(async (signal) => {
  const response = await fetch(buildUrl('/health'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
});

export const testAiConnection = async ({ aiConfig } = {}) => {
  const serializedAiConfig = serializeAiSettings(aiConfig);
  const orchestration = serializeOrchestrationMode(aiConfig);

  return requestJson('/api/connection-test', {
    ...(serializedAiConfig ? { aiConfig: serializedAiConfig } : {}),
    ...(orchestration ? { orchestration } : {}),
  });
};

export const requestReadingStream = async ({ cards, language, question, aiConfig, onMeta, onPhase, onPartial }) => {
  const fallback = buildReading(cards, { language, question, source: 'local-fallback' });
  const serializedAiConfig = serializeAiSettings(aiConfig);
  const orchestration = serializeOrchestrationMode(aiConfig);
  const timeoutController = createStreamTimeoutController();

  try {
    const response = await fetch(buildUrl('/api/reading/stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        language,
        question,
        cards: serializeCards(cards),
        ...(serializedAiConfig ? { aiConfig: serializedAiConfig } : {}),
        ...(orchestration ? { orchestration } : {}),
      }),
      signal: timeoutController.signal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    let finalReading = null;

    await consumeEventStream(response.body, async ({ event, data }) => {
      timeoutController.reset();

      if (event === 'meta') {
        if (onMeta) {
          await onMeta(data);
        }
        return;
      }

      if (event === 'phase') {
        if (onPhase) {
          await onPhase(data);
        }
        return;
      }

      if (event === 'partial') {
        const partialReading = normalizeStreamingReadingResult(data.reading, cards, {
          language,
          question,
          source: data.reading?.source || 'api',
          model: data.reading?.model || null,
          createdAt: data.reading?.createdAt,
        });

        if (partialReading && onPartial) {
          await onPartial(partialReading, { stage: data.stage || null });
        }
        return;
      }

      if (event === 'complete') {
        finalReading = normalizeReadingResult(data.reading, cards, {
          language,
          question,
          source: data.reading?.source || 'api',
          model: data.reading?.model || null,
          createdAt: data.reading?.createdAt,
        });
        return;
      }

      if (event === 'error') {
        throw new Error(data.error || 'Streaming request failed');
      }
    }, timeoutController);

    if (!finalReading) {
      throw new Error('Streaming response ended before completion');
    }

    return {
      reading: finalReading,
      usedFallback: false,
    };
  } catch (error) {
    const normalizedError = error?.name === 'AbortError'
      ? new Error(timeoutController.timeoutMessage)
      : error;

    console.warn('Falling back to local reading:', normalizedError);
    return {
      reading: fallback,
      usedFallback: true,
    };
  } finally {
    timeoutController.clear();
  }
};

export const requestReading = async ({ cards, language, question, aiConfig }) => {
  const fallback = buildReading(cards, { language, question, source: 'local-fallback' });
  const serializedAiConfig = serializeAiSettings(aiConfig);
  const orchestration = serializeOrchestrationMode(aiConfig);

  try {
    const payload = {
      language,
      question,
      cards: serializeCards(cards),
      ...(serializedAiConfig ? { aiConfig: serializedAiConfig } : {}),
      ...(orchestration ? { orchestration } : {}),
    };
    const response = await requestJson('/api/reading', payload);
    return {
      reading: normalizeReadingResult(response.reading, cards, {
        language,
        question,
        source: response.reading?.source || 'api',
        model: response.reading?.model || null,
        createdAt: response.reading?.createdAt,
      }),
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Falling back to local reading:', error);
    return {
      reading: fallback,
      usedFallback: true,
    };
  }
};

export const requestFollowUp = async ({ cards, language, question, previousReading, aiConfig }) => {
  const fallback = buildReading(cards, { language, question, source: 'local-fallback' });
  const serializedAiConfig = serializeAiSettings(aiConfig);
  const orchestration = serializeOrchestrationMode(aiConfig);

  try {
    const payload = {
      language,
      question,
      cards: serializeCards(cards),
      previousReading,
      ...(serializedAiConfig ? { aiConfig: serializedAiConfig } : {}),
      ...(orchestration ? { orchestration } : {}),
    };
    const response = await requestJson('/api/followup', payload);
    return {
      reading: normalizeReadingResult(response.reading, cards, {
        language,
        question,
        source: response.reading?.source || 'api',
        model: response.reading?.model || null,
        createdAt: response.reading?.createdAt,
      }),
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Falling back to local follow-up:', error);
    return {
      reading: fallback,
      usedFallback: true,
    };
  }
};
