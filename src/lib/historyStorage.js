import { tarotCards } from '../data/tarotCards.js';
import { normalizeReadingResult, mergeReadingWithBase } from './readingContract.js';
import { buildReading, serializeCards } from './tarotReading.js';

const STORAGE_KEY = 'tarot_history';
const MAX_HISTORY = 50;

const isBrowser = typeof window !== 'undefined';

const readRawHistory = () => {
  if (!isBrowser) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse history', error);
    return [];
  }
};

const writeRawHistory = (records) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const hydrateCard = (card) => {
  const freshCard = tarotCards.find((candidate) => candidate.id === card.id);
  return freshCard ? { ...freshCard, isReversed: Boolean(card.isReversed) } : card;
};

export const hydrateHistoryRecord = (record, fallbackLanguage = 'en') => {
  const cards = Array.isArray(record.cards) ? record.cards.map(hydrateCard) : [];
  const baseReading = buildReading(cards, {
    language: record.reading?.language || record.language || fallbackLanguage,
    question: record.question || '',
    source: record.reading?.source || 'local-fallback',
    model: record.reading?.model || null,
    createdAt: record.reading?.createdAt || record.timestamp,
  });

  const reading = record.reading
    ? mergeReadingWithBase(baseReading, record.reading, {
      source: record.reading.source,
      model: record.reading.model,
      language: record.reading.language || record.language || fallbackLanguage,
      question: record.question || record.reading.question,
      createdAt: record.reading.createdAt || record.timestamp,
    })
    : null;

  return {
    ...record,
    cards,
    reading,
  };
};

export const createHistoryRecord = ({
  id = Date.now(),
  timestamp = new Date().toISOString(),
  cards = [],
  question = '',
  reading = null,
  language = reading?.language || null,
}) => ({
  id,
  timestamp,
  question,
  language,
  cards: serializeCards(cards),
  reading,
});

export const loadHistoryRecords = (fallbackLanguage = 'en') => readRawHistory().map((record) => hydrateHistoryRecord(record, fallbackLanguage)).reverse();

export const upsertHistoryRecord = (record) => {
  const records = readRawHistory();
  const nextRecord = createHistoryRecord(record);
  const index = records.findIndex((item) => item.id === nextRecord.id);

  if (index >= 0) {
    records[index] = nextRecord;
  } else {
    records.push(nextRecord);
  }

  const trimmed = records.slice(-MAX_HISTORY);
  writeRawHistory(trimmed);

  return hydrateHistoryRecord(nextRecord, nextRecord.language || 'en');
};

export const clearHistoryRecords = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const normalizeStoredReading = (reading, cards, options = {}) => normalizeReadingResult(reading, cards, options);
