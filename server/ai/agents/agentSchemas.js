import { aiReadingJsonSchema } from '../../../src/lib/readingContract.js';
import { readingSlots } from '../../../src/lib/tarotReading.js';

export const draftReadingJsonSchema = aiReadingJsonSchema;
export const finalReadingJsonSchema = aiReadingJsonSchema;

export const reviewReadingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    strengths: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
    },
    risks: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
    },
    revisionPlan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        quote: { type: 'string' },
        perCard: {
          type: 'array',
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
          maxItems: 3,
          items: { type: 'string' },
        },
        followUps: {
          type: 'array',
          maxItems: 4,
          items: { type: 'string' },
        },
        mantra: { type: 'string' },
        safetyNote: { type: 'string' },
      },
    },
  },
  required: ['strengths', 'risks', 'revisionPlan'],
};
