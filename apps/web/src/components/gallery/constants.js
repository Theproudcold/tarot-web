export const INITIAL_VISIBLE_COUNT = 24;
export const LOAD_MORE_STEP = 24;
export const RECENT_CARD_LIMIT = 8;
export const COMPARE_CARD_LIMIT = 3;
export const MAJOR_ARCANA_SUITS = new Set(['Major Arcana', '大阿卡那']);
export const SECTION_ORDER = new Map([
  ['Major Arcana', 0],
  ['Wands', 1],
  ['Cups', 2],
  ['Swords', 3],
  ['Pentacles', 4],
]);
export const STORAGE_KEYS = {
  displayMode: 'tarot-gallery-display-mode',
  density: 'tarot-gallery-density',
  recentCardIds: 'tarot-gallery-recent-card-ids',
  favoriteCardIds: 'tarot-gallery-favorite-card-ids',
};

export const createSectionId = (key) => `gallery-section-${String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
