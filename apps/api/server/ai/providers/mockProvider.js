import { buildReading } from '../../../src/lib/tarotReading.js';

export const createMockReading = async ({ cards, language, question, createdAt }) => ({
  reading: {
    ...buildReading(cards, {
      language,
      question,
      createdAt,
      source: 'mock-server',
      model: 'deterministic-mock',
    }),
    orchestration: 'mock',
    agentPipeline: ['mock'],
  },
});
