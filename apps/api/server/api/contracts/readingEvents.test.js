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
      timestamp: '2026-05-23T00:00:00.000Z',
    })).toEqual({
      stage: 'draft',
      status: 'started',
      label: null,
      provider: 'openai',
      model: 'gpt-5-mini',
      detail: '',
      timestamp: '2026-05-23T00:00:00.000Z',
    });
  });

  it('keeps the expected runtime phase order', () => {
    expect(READING_PHASES).toEqual(['draft', 'review', 'finalize', 'fallback']);
  });

  it('rejects unknown stages', () => {
    expect(() => createPhaseEvent({ stage: 'wat', status: 'started' })).toThrow('Unknown reading phase');
  });
});
