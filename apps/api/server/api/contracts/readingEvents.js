export const READING_EVENTS = Object.freeze({
  meta: 'meta',
  phase: 'phase',
  partial: 'partial',
  complete: 'complete',
  error: 'error',
});

export const READING_PHASES = Object.freeze(['draft', 'review', 'finalize', 'fallback']);

export const READING_PHASE_STATUSES = Object.freeze([
  'pending',
  'started',
  'completed',
  'triggered',
  'failed',
]);

export const createPhaseEvent = ({
  stage,
  status,
  label = null,
  provider = null,
  model = null,
  detail = '',
  timestamp = new Date().toISOString(),
} = {}) => {
  if (!READING_PHASES.includes(stage)) {
    throw new Error(`Unknown reading phase: ${stage}`);
  }

  if (!READING_PHASE_STATUSES.includes(status)) {
    throw new Error(`Unknown reading phase status: ${status}`);
  }

  return {
    stage,
    status,
    label,
    provider,
    model,
    detail: typeof detail === 'string' ? detail : '',
    timestamp,
  };
};
