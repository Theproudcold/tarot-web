import {
  getActiveOrchestrationMode,
  getActiveProvider,
  runReadingOrchestrator,
} from '../../ai/orchestrator.js';
import { streamReadingFrames } from '../../ai/streaming.js';
import { READING_EVENTS } from '../contracts/readingEvents.js';
import { openFastifyEventStream, writeFastifySseEvent } from '../http/sse.js';
import { validateReadingRequest } from '../http/body.js';

const formatPhaseLog = (phase = {}) => {
  const detail = typeof phase.detail === 'string' && phase.detail.trim() ? ` — ${phase.detail.trim()}` : '';
  const runtime = [phase.provider, phase.model].filter(Boolean).join(' / ');
  const suffix = runtime ? ` (${runtime})` : '';
  return `[reading phase] ${phase.stage || 'unknown'}:${phase.status || 'unknown'}${suffix}${detail}`;
};

const handleReadingJson = async (request, reply) => {
  try {
    const payload = validateReadingRequest(request.body);
    return await runReadingOrchestrator(payload);
  } catch (error) {
    reply.code(400);
    return { error: error.message || 'Request failed' };
  }
};

const handleReadingStream = async (request, reply) => {
  const abortedRef = { current: false };
  let streamOpened = false;
  request.raw.on('aborted', () => {
    abortedRef.current = true;
  });
  reply.raw.on('close', () => {
    abortedRef.current = true;
  });

  try {
    const payload = validateReadingRequest(request.body);
    openFastifyEventStream(reply);
    streamOpened = true;

    const runtimeProvider = getActiveProvider(payload.aiConfig);
    writeFastifySseEvent(reply, READING_EVENTS.meta, {
      ok: true,
      provider: runtimeProvider,
      orchestration: runtimeProvider === 'mock' ? 'mock' : getActiveOrchestrationMode(payload.orchestration),
    });

    const result = await runReadingOrchestrator(payload, {
      onPhase: async (phase) => {
        console.info(formatPhaseLog(phase));

        if (!abortedRef.current) {
          writeFastifySseEvent(reply, READING_EVENTS.phase, phase);
        }
      },
      onPartialReading: async (snapshot) => {
        if (!abortedRef.current) {
          writeFastifySseEvent(reply, READING_EVENTS.partial, snapshot);
        }
      },
    });

    if (result.nativeFinalStream) {
      if (!abortedRef.current) {
        writeFastifySseEvent(reply, READING_EVENTS.complete, { reading: result.reading, stage: 'finalize' });
      }
    } else {
      await streamReadingFrames(reply.raw, result.reading, { abortedRef, stage: 'finalize' });
    }
  } catch (error) {
    if (!reply.sent && !reply.raw.headersSent) {
      reply.code(400);
      return { error: error.message || 'Streaming request failed' };
    }

    writeFastifySseEvent(reply, READING_EVENTS.error, { error: error.message || 'Streaming request failed' });
  } finally {
    if (streamOpened && reply.raw.writableEnded === false) {
      reply.raw.end();
    }
  }

  return reply;
};

export const registerReadingRoutes = (app) => {
  app.post('/api/reading/stream', handleReadingStream);
  app.post('/api/reading', handleReadingJson);
  app.post('/api/followup', handleReadingJson);
};
