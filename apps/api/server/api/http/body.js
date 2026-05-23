import { tarotCards } from '../../../../web/src/data/tarotCards.js';

const cardIndex = new Map(tarotCards.map((card) => [card.id, card]));

export const hydrateCards = (cards = []) => cards.map((card) => {
  const sourceCard = cardIndex.get(card.id);
  if (!sourceCard) {
    throw new Error(`Unknown card id: ${card.id}`);
  }

  return {
    ...sourceCard,
    isReversed: Boolean(card.isReversed),
  };
});

export const normalizeAiConfig = (value) => {
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

export const normalizeOrchestration = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'single' || normalized === 'multi' ? normalized : null;
};

export const validateReadingRequest = (body) => {
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

export const validateConnectionTestRequest = (body) => ({
  aiConfig: normalizeAiConfig(body?.aiConfig),
  orchestration: normalizeOrchestration(body?.orchestration),
});
