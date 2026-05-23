import { aiReadingJsonSchema } from '../../../../web/src/lib/readingContract.js';
import { readingSlots } from '../../../../web/src/lib/tarotReading.js';

export const draftReadingJsonSchema = aiReadingJsonSchema;
export const finalReadingJsonSchema = aiReadingJsonSchema;

export const reviewReadingJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    strengths: {
      type: 'array',
      description: 'List 1-4 strong points of the draft, such as specific imagery, insightful narrative flow, or well-tailored advice.',
      items: { type: 'string' },
    },
    risks: {
      type: 'array',
      description: 'List 1-4 risks, focusing on generic phrasing, lack of specific card evidence, missing timeline narrative, or fatalism.',
      items: { type: 'string' },
    },
    revisionPlan: {
      type: 'object',
      description: 'Provide revisions ONLY for fields that suffer from the risks identified. Omit fields that are already strong by passing null.',
      additionalProperties: false,
      properties: {
        summary: { type: ['string', 'null'], description: 'Revised summary highlighting the emerging trend or elemental imbalance. Null if no change.' },
        quote: { type: ['string', 'null'], description: 'A highly bespoke, non-generic stinger tailored to this exact reading. Null if no change.' },
        perCard: {
          type: ['array', 'null'],
          description: 'Revisions for specific card slots. Only include slots that need narrative or evidence improvements. Null if no change.',
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
          type: ['array', 'null'],
          description: 'Revised advice. Must include at least 1 micro-action and 1 cognitive shift. Avoid platitudes. Null if no change.',
          items: { type: 'string' },
        },
        followUps: {
          type: ['array', 'null'],
          description: 'Revised follow-up questions. Start with an emotional block and progress to the core contradiction. Null if no change.',
          items: { type: 'string' },
        },
        mantra: { type: ['string', 'null'], description: 'A short, actionable, and highly specific grounding phrase. Null if no change.' },
        safetyNote: { type: ['string', 'null'] },
      },
      required: ['summary', 'quote', 'perCard', 'advice', 'followUps', 'mantra', 'safetyNote'],
    },
  },
  required: ['strengths', 'risks', 'revisionPlan'],
};
