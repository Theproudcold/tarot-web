import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tarotCards } from '../src/data/tarotCards.js';
import {
  runReadingOrchestrator,
  getActiveOrchestrationMode,
  getActiveProvider,
  testReadingProviderConnection,
} from './ai/orchestrator.js';
import { streamReadingFrames, writeSseEvent } from './ai/streaming.js';

const env = globalThis.process?.env ?? {};
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, env.STATIC_DIST_DIR || 'dist');
const distIndexPath = resolve(distDir, 'index.html');
const hasStaticBuild = existsSync(distIndexPath);

const PORT = Number(env.PORT || 8787);
const MAX_BODY_SIZE = 1024 * 1024;

const cardIndex = new Map(tarotCards.map((card) => [card.id, card]));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const normalizeOriginList = (value) => {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const configuredOrigins = normalizeOriginList(env.CORS_ORIGIN);

const getCorsHeaders = (request) => {
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  if (configuredOrigins.length === 0) {
    return headers;
  }

  if (configuredOrigins.includes('*')) {
    return {
      ...headers,
      'Access-Control-Allow-Origin': '*',
    };
  }

  const requestOrigin = request.headers.origin;

  if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    return {
      ...headers,
      'Access-Control-Allow-Origin': requestOrigin,
      Vary: 'Origin',
    };
  }

  if (!requestOrigin && configuredOrigins.length === 1) {
    return {
      ...headers,
      'Access-Control-Allow-Origin': configuredOrigins[0],
      Vary: 'Origin',
    };
  }

  return headers;
};

const sendJson = (request, response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCorsHeaders(request),
  });
  response.end(JSON.stringify(payload));
};

const openEventStream = (request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...getCorsHeaders(request),
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

const formatPhaseLog = (phase = {}) => {
  const detail = typeof phase.detail === 'string' && phase.detail.trim() ? ` — ${phase.detail.trim()}` : '';
  const runtime = [phase.provider, phase.model].filter(Boolean).join(' / ');
  const suffix = runtime ? ` (${runtime})` : '';
  return `[reading phase] ${phase.stage || 'unknown'}:${phase.status || 'unknown'}${suffix}${detail}`;
};

const getStaticContentType = (filePath) => mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';

const canServeStatic = hasStaticBuild;

const resolveStaticFilePath = (pathname) => {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = resolve(distDir, `.${relativePath}`);

  if (!filePath.startsWith(distDir)) {
    return null;
  }

  return filePath;
};

const sendFile = async (request, response, filePath) => {
  const fileStats = await stat(filePath);

  response.writeHead(200, {
    'Content-Type': getStaticContentType(filePath),
    'Content-Length': fileStats.size,
    'Cache-Control': filePath.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const stream = createReadStream(filePath);
    stream.on('error', rejectPromise);
    stream.on('end', resolvePromise);
    stream.pipe(response, { end: true });
  });
};

const maybeServeStatic = async (request, response, pathname) => {
  if (!canServeStatic || !['GET', 'HEAD'].includes(request.method)) {
    return false;
  }

  if (pathname === '/health' || pathname.startsWith('/api/')) {
    return false;
  }

  const directFilePath = resolveStaticFilePath(pathname);

  if (directFilePath) {
    try {
      const fileStats = await stat(directFilePath);
      if (fileStats.isFile()) {
        await sendFile(request, response, directFilePath);
        return true;
      }
    } catch {
      // fall through to SPA fallback
    }
  }

  if (extname(pathname)) {
    return false;
  }

  await sendFile(request, response, distIndexPath);
  return true;
};

const requestHandler = async (request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  const pathname = requestUrl.pathname;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, getCorsHeaders(request));
    response.end();
    return;
  }

  if (request.method === 'GET' && pathname === '/health') {
    sendJson(request, response, 200, {
      ok: true,
      provider: getActiveProvider(),
      orchestration: getActiveOrchestrationMode(),
      model: env.OPENAI_MODEL || 'gpt-5-mini',
      staticApp: canServeStatic,
    });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/connection-test') {
    try {
      const body = await readJsonBody(request);
      const payload = validateConnectionTestRequest(body);
      const result = await testReadingProviderConnection(payload);
      sendJson(request, response, 200, result);
    } catch (error) {
      sendJson(request, response, 400, { error: error.message || 'Connection test failed' });
    }
    return;
  }

  if (request.method === 'POST' && pathname === '/api/reading/stream') {
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
      openEventStream(request, response);
      const runtimeProvider = getActiveProvider(payload.aiConfig);
      writeSseEvent(response, 'meta', {
        ok: true,
        provider: runtimeProvider,
        orchestration: runtimeProvider === 'mock' ? 'mock' : getActiveOrchestrationMode(payload.orchestration),
      });
      const result = await runReadingOrchestrator(payload, {
        onPhase: async (phase) => {
          console.info(formatPhaseLog(phase));

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

      if (result.nativeFinalStream) {
        if (!abortedRef.current) {
          writeSseEvent(response, 'complete', { reading: result.reading, stage: 'finalize' });
        }
      } else {
        await streamReadingFrames(response, result.reading, { abortedRef, stage: 'finalize' });
      }
    } catch (error) {
      if (!response.headersSent) {
        sendJson(request, response, 400, { error: error.message || 'Streaming request failed' });
        return;
      }
      writeSseEvent(response, 'error', { error: error.message || 'Streaming request failed' });
    } finally {
      response.end();
    }
    return;
  }

  if (request.method === 'POST' && (pathname === '/api/reading' || pathname === '/api/followup')) {
    try {
      const body = await readJsonBody(request);
      const payload = validateRequest(body);
      const result = await runReadingOrchestrator(payload);
      sendJson(request, response, 200, result);
    } catch (error) {
      sendJson(request, response, 400, { error: error.message || 'Request failed' });
    }
    return;
  }

  if (await maybeServeStatic(request, response, pathname)) {
    return;
  }

  sendJson(request, response, 404, { error: 'Not found' });
};

export const createTarotServer = () => createServer(requestHandler);

export const startServer = () => {
  const server = createTarotServer();
  server.listen(PORT, () => {
    const staticMessage = canServeStatic
      ? ` and frontend on http://localhost:${PORT}`
      : '';
    console.log(`Tarot AI API listening on http://localhost:${PORT}${staticMessage}`);
  });
  return server;
};

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  startServer();
}
