import { createServer } from 'node:http';
import { tarotCards } from '../src/data/tarotCards.js';
import {
  runReadingOrchestrator,
  getActiveOrchestrationMode,
  getActiveProvider,
  testReadingProviderConnection,
} from './ai/orchestrator.js';
import { streamReadingFrames, writeSseEvent } from './ai/streaming.js';

const env = globalThis.process?.env ?? {};
const PORT = Number(env.PORT || 8787);
const MAX_BODY_SIZE = 1024 * 1024;

const cardIndex = new Map(tarotCards.map((card) => [card.id, card]));

const commonCorsHeaders = {
  'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...commonCorsHeaders,
  });
  response.end(JSON.stringify(payload));
};

const openEventStream = (response) => {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...commonCorsHeaders,
  });

  response.socket?.setNoDelay?.(true);
  response.flushHeaders?.();
  response.write(`: ${' '.repeat(2048)}\n\n`);
};

const readJsonBody = async (request) => new Promise((resolve, reject) => {
  let size = 0;
  let body = '';

  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      reject(new Error('Request body is too large'));
      request.destroy();
      return;
    }
    body += chunk;
  });

  request.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch {
      reject(new Error('Invalid JSON body'));
    }
  });

  request.on('error', reject);
});

const hydrateCards = (cards = []) => cards.map((card) => {
  const sourceCard = cardIndex.get(card.id);
  if (!sourceCard) {
    throw new Error(`Unknown card id: ${card.id}`);
  }

  return {
    ...sourceCard,
    isReversed: Boolean(card.isReversed),
  };
});

const normalizeAiConfig = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const apiBaseUrl = typeof value.apiBaseUrl === 'string' ? value.apiBaseUrl.trim() : '';
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey.trim() : '';
  const model = typeof value.model === 'string' ? value.model.trim() : '';

  if (!apiBaseUrl && !apiKey && !model) {
    return null;
  }

  return {
    ...(apiBaseUrl ? { apiBaseUrl } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(model ? { model } : {}),
  };
};

const normalizeOrchestration = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'single' || normalized === 'multi' ? normalized : null;
};

const validateRequest = (body) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  if (!['en', 'zh'].includes(body.language)) {
    throw new Error('language must be `en` or `zh`');
  }

  if (!Array.isArray(body.cards) || body.cards.length !== 3) {
    throw new Error('cards must contain exactly three items');
  }

  return {
    language: body.language,
    question: typeof body.question === 'string' ? body.question.trim() : '',
    cards: hydrateCards(body.cards),
    previousReading: body.previousReading && typeof body.previousReading === 'object' ? body.previousReading : null,
    aiConfig: normalizeAiConfig(body.aiConfig),
    orchestration: normalizeOrchestration(body.orchestration),
    createdAt: new Date().toISOString(),
  };
};

const validateConnectionTestRequest = (body) => ({
  aiConfig: normalizeAiConfig(body?.aiConfig),
  orchestration: normalizeOrchestration(body?.orchestration),
});

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, commonCorsHeaders);
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      provider: getActiveProvider(),
      orchestration: getActiveOrchestrationMode(),
      model: env.OPENAI_MODEL || 'gpt-5-mini',
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/connection-test') {
    try {
      const body = await readJsonBody(request);
      const payload = validateConnectionTestRequest(body);
      const result = await testReadingProviderConnection(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Connection test failed' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/reading/stream') {
    const abortedRef = { current: false };
    request.on('aborted', () => {
      abortedRef.current = true;
    });
    response.on('close', () => {
      abortedRef.current = true;
    });

    try {
      const body = await readJsonBody(request);
      const payload = validateRequest(body);
      openEventStream(response);
      const runtimeProvider = getActiveProvider(payload.aiConfig);
      writeSseEvent(response, 'meta', {
        ok: true,
        provider: runtimeProvider,
        orchestration: runtimeProvider === 'mock' ? 'mock' : getActiveOrchestrationMode(payload.orchestration),
      });
      const result = await runReadingOrchestrator(payload, {
        onPhase: async (phase) => {
          if (!abortedRef.current) {
            writeSseEvent(response, 'phase', phase);
          }
        },
        onPartialReading: async (snapshot) => {
          if (!abortedRef.current) {
            writeSseEvent(response, 'partial', snapshot);
          }
        },
      });
      await streamReadingFrames(response, result.reading, { abortedRef, stage: 'finalize' });
    } catch (error) {
      if (!response.headersSent) {
        sendJson(response, 400, { error: error.message || 'Streaming request failed' });
        return;
      }
      writeSseEvent(response, 'error', { error: error.message || 'Streaming request failed' });
    } finally {
      response.end();
    }
    return;
  }

  if (request.method === 'POST' && (request.url === '/api/reading' || request.url === '/api/followup')) {
    try {
      const body = await readJsonBody(request);
      const payload = validateRequest(body);
      const result = await runReadingOrchestrator(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Request failed' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Tarot AI API listening on http://localhost:${PORT}`);
});
