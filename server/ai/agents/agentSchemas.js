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
      description: 'List 1-4 strong points of the draft, such as specific imagery, insightful narrative flow, or well-tailored advice.',
      maxItems: 4,
      items: { type: 'string' },
    },
    risks: {
      type: 'array',
      description: 'List 1-4 risks, focusing on generic phrasing, lack of specific card evidence, missing timeline narrative, or fatalism.',
      maxItems: 4,
      items: { type: 'string' },
    },
    revisionPlan: {
      type: 'object',
      description: 'Provide revisions ONLY for fields that suffer from the risks identified. Omit fields that are already strong.',
      additionalProperties: false,
      properties: {
        summary: { type: 'string', description: 'Revised summary highlighting the emerging trend or elemental imbalance.' },
        quote: { type: 'string', description: 'A highly bespoke, non-generic stinger tailored to this exact reading.' },
        perCard: {
          type: 'array',
          description: 'Revisions for specific card slots. Only include slots that need narrative or evidence improvements.',
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
          description: 'Revised advice. Must include at least 1 micro-action and 1 cognitive shift. Avoid platitudes.',
          maxItems: 3,
          items: { type: 'string' },
        },
        followUps: {
          type: 'array',
          description: 'Revised follow-up questions. Start with an emotional block and progress to the core contradiction.',
          maxItems: 4,
          items: { type: 'string' },
        },
        mantra: { type: 'string', description: 'A short, actionable, and highly specific grounding phrase.' },
        safetyNote: { type: 'string' },
      },
    },
  },
  required: ['strengths', 'risks', 'revisionPlan'],
};
