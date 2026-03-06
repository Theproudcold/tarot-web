import { buildReading, buildReadingSkeleton, readingSlots } from './tarotReading.js';

export const aiReadingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    quote: { type: 'string' },
    perCard: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slot: { type: 'string', enum: readingSlots },
          message: { type: 'string' },
        },
        required: ['slot', 'message'],
      },
    },
    advice: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: { type: 'string' },
    },
    followUps: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: { type: 'string' },
    },
    mantra: { type: 'string' },
    safetyNote: { type: 'string' },
  },
  required: ['summary', 'quote', 'perCard', 'advice', 'followUps', 'mantra', 'safetyNote'],
};

const normalizeStringArray = (value, fallback) => (
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())
    ? value
    : fallback
);

export const mergeReadingWithBase = (baseReading, partialReading = {}, metadata = {}) => {
  if (!baseReading) return null;

  const {
    summary,
    quote,
    perCard,
    advice,
    followUps,
    mantra,
    safetyNote,
    ...restPartialReading
  } = partialReading || {};

  const perCardOverrides = new Map(
    Array.isArray(perCard)
      ? perCard
        .filter((item) => item && typeof item.slot === 'string')
        .map((item) => [item.slot, item])
      : []
  );

  return {
    ...baseReading,
    ...restPartialReading,
    ...metadata,
    language: metadata.language ?? partialReading.language ?? baseReading.language,
    question: metadata.question ?? partialReading.question ?? baseReading.question,
    createdAt: metadata.createdAt ?? partialReading.createdAt ?? baseReading.createdAt,
    source: metadata.source ?? partialReading.source ?? baseReading.source,
    model: metadata.model ?? partialReading.model ?? baseReading.model,
    summary: typeof summary === 'string' && summary.trim()
      ? summary
      : baseReading.summary,
    quote: typeof quote === 'string' && quote.trim()
      ? quote
      : baseReading.quote,
    perCard: baseReading.perCard.map((cardReading) => ({
      ...cardReading,
      ...(perCardOverrides.get(cardReading.slot) || {}),
    })),
    advice: normalizeStringArray(advice, baseReading.advice),
    followUps: normalizeStringArray(followUps, baseReading.followUps),
    mantra: typeof mantra === 'string' && mantra.trim()
      ? mantra
      : baseReading.mantra,
    safetyNote: typeof safetyNote === 'string' && safetyNote.trim()
      ? safetyNote
      : baseReading.safetyNote,
  };
};

export const normalizeReadingResult = (reading, cards, options = {}) => {
  const baseReading = buildReading(cards, options);

  if (!baseReading) return null;
  if (!reading || typeof reading !== 'object') return baseReading;

  return mergeReadingWithBase(baseReading, reading, {
    language: reading.language ?? options.language,
    source: reading.source,
    model: reading.model,
    question: options.question ?? reading.question,
    createdAt: reading.createdAt,
  });
};

export const normalizeStreamingReadingResult = (reading, cards, options = {}) => {
  const baseReading = buildReadingSkeleton(cards, options);

  if (!baseReading) return null;
  if (!reading || typeof reading !== 'object') return baseReading;

  return mergeReadingWithBase(baseReading, reading, {
    language: reading.language ?? options.language,
    source: reading.source,
    model: reading.model,
    question: options.question ?? reading.question,
    createdAt: reading.createdAt,
  });
};
