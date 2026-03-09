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

const genericReflectionPatterns = [
  /答案在你心里/u,
  /先回到自己/u,
  /温柔行动/u,
  /宇宙会带路/u,
  /顺其自然/u,
  /相信自己/u,
  /看清真实/u,
  /真正想要的是什么/u,
  /最重要的是什么/u,
  /倾听内心的声音/u,
  /找到内在的力量/u,
  /一切都是最好的安排/u,
  /命运的指引/u,
  /保持觉察/u,
  /遵循你的直觉/u,
  /return to yourself/i,
  /answer is within you/i,
  /what do you really want/i,
  /what matters most/i,
  /universe will guide/i,
  /move gently/i,
  /trust yourself/i,
  /go with the flow/i,
  /listen to your inner voice/i,
  /find your inner strength/i,
  /everything happens for a reason/i,
  /trust the process/i,
  /follow your intuition/i,
];

const normalizeStringArray = (value, fallback) => (
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())
    ? value
    : fallback
);

const normalizeComparableText = (value = '') => value.toLowerCase().replace(/[“”"'`]/g, '').trim();
const compactReflectionText = (value = '') => normalizeComparableText(value).replace(/\s+/g, '');

const buildReflectionAnchors = (reading) => [
  reading?.dominantElement?.label,
  ...(Array.isArray(reading?.perCard)
    ? reading.perCard.map((item) => item.title)
    : []),
].filter((item) => typeof item === 'string' && item.trim().length >= 2);

const hasSpreadAnchor = (text, reading) => {
  const normalizedText = normalizeComparableText(text);
  return buildReflectionAnchors(reading).some((anchor) => normalizedText.includes(normalizeComparableText(anchor)));
};

const shouldFallbackReflectionText = (text, baseReading) => {
  if (typeof text !== 'string' || !text.trim()) {
    return true;
  }

  if (genericReflectionPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  return compactReflectionText(text).length <= 4 && !hasSpreadAnchor(text, baseReading);
};

const normalizeFollowUps = (value, fallback, baseReading) => {
  const nextValue = normalizeStringArray(value, fallback);

  if (nextValue === fallback) {
    return fallback;
  }

  const filteredValue = nextValue.filter((item) => !shouldFallbackReflectionText(item, baseReading));
  return filteredValue.length >= 2 ? filteredValue : fallback;
};

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
    quote: shouldFallbackReflectionText(quote, baseReading)
      ? baseReading.quote
      : quote,
    perCard: baseReading.perCard.map((cardReading) => {
      const override = perCardOverrides.get(cardReading.slot);
      if (!override) return cardReading;
      const { message, ...restOverride } = override;
      return {
        ...cardReading,
        ...restOverride,
        ...(typeof message === 'string' && message.trim() ? { message } : {}),
      };
    }),
    advice: normalizeStringArray(advice, baseReading.advice),
    followUps: normalizeFollowUps(followUps, baseReading.followUps, baseReading),
    mantra: shouldFallbackReflectionText(mantra, baseReading)
      ? baseReading.mantra
      : mantra,
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
