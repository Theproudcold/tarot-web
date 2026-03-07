import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from './Card';
import CardDetailModal from './CardDetailModal';

const INITIAL_VISIBLE_COUNT = 24;
const LOAD_MORE_STEP = 24;
const RECENT_CARD_LIMIT = 8;
const COMPARE_CARD_LIMIT = 3;
const MAJOR_ARCANA_SUITS = new Set(['Major Arcana', '大阿卡那']);
const SECTION_ORDER = new Map([
  ['Major Arcana', 0],
  ['Wands', 1],
  ['Cups', 2],
  ['Swords', 3],
  ['Pentacles', 4],
]);
const STORAGE_KEYS = {
  displayMode: 'tarot-gallery-display-mode',
  density: 'tarot-gallery-density',
  recentCardIds: 'tarot-gallery-recent-card-ids',
  favoriteCardIds: 'tarot-gallery-favorite-card-ids',
};

const readStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const readStoredJson = (key, fallback) => {
  const rawValue = readStoredValue(key, null);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
};

const createSectionId = (key) => `gallery-section-${String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const Gallery = ({ cards, language = 'en', t = (key) => key }) => {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [query, setQuery] = useState('');
  const [arcanaFilter, setArcanaFilter] = useState('all');
  const [suiteFilter, setSuiteFilter] = useState('all');
  const [elementFilter, setElementFilter] = useState('all');
  const [sortBy, setSortBy] = useState('arcana');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [density, setDensity] = useState(() => {
    const storedValue = readStoredValue(STORAGE_KEYS.density, 'comfortable');
    return storedValue === 'compact' ? 'compact' : 'comfortable';
  });
  const [displayMode, setDisplayMode] = useState(() => {
    const storedValue = readStoredValue(STORAGE_KEYS.displayMode, 'grid');
    return storedValue === 'grouped' ? 'grouped' : 'grid';
  });
  const [favoriteCardIds, setFavoriteCardIds] = useState(() => {
    const storedValue = readStoredJson(STORAGE_KEYS.favoriteCardIds, []);
    return Array.isArray(storedValue) ? storedValue.map(Number).filter(Number.isFinite) : [];
  });
  const [recentCardIds, setRecentCardIds] = useState(() => {
    const storedValue = readStoredJson(STORAGE_KEYS.recentCardIds, []);
    return Array.isArray(storedValue) ? storedValue.map(Number).filter(Number.isFinite) : [];
  });
  const [compareCardIds, setCompareCardIds] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const getLocalized = useCallback((value) => {
    if (typeof value === 'string') return value;
    return value?.[language] || value?.en || '';
  }, [language]);

  const normalizedQuery = query.trim().toLowerCase();

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const allCardsSorted = useMemo(() => [...cards].sort((left, right) => left.id - right.id), [cards]);

  const elementLabelMap = useMemo(() => ({
    Fire: t('galleryElementFire'),
    Water: t('galleryElementWater'),
    Air: t('galleryElementAir'),
    Earth: t('galleryElementEarth'),
  }), [t]);

  const suiteOptions = useMemo(() => {
    const options = new Map();

    cards.forEach((card) => {
      const suiteLabel = getLocalized(card.suite);
      if (suiteLabel) {
        options.set(suiteLabel, suiteLabel);
      }
    });

    return Array.from(options.values());
  }, [cards, getLocalized]);

  const elementOptions = useMemo(() => {
    const options = new Map();

    cards.forEach((card) => {
      if (card.element) {
        options.set(card.element, card.element);
      }
    });

    return Array.from(options.keys());
  }, [cards]);

  const filteredCards = useMemo(() => {
    const result = cards.filter((card) => {
      const localizedName = getLocalized(card.name);
      const localizedSuite = getLocalized(card.suite);
      const isMajor = MAJOR_ARCANA_SUITS.has(localizedSuite);
      const isFavorite = favoriteCardIds.includes(card.id);

      const matchesQuery = !normalizedQuery
        || localizedName.toLowerCase().includes(normalizedQuery)
        || localizedSuite.toLowerCase().includes(normalizedQuery)
        || String(card.id).includes(normalizedQuery)
        || String(card.element || '').toLowerCase().includes(normalizedQuery);

      const matchesArcana = arcanaFilter === 'all'
        || (arcanaFilter === 'major' && isMajor)
        || (arcanaFilter === 'minor' && !isMajor);

      const matchesSuite = suiteFilter === 'all' || localizedSuite === suiteFilter;
      const matchesElement = elementFilter === 'all' || card.element === elementFilter;
      const matchesFavorite = !favoritesOnly || isFavorite;

      return matchesQuery && matchesArcana && matchesSuite && matchesElement && matchesFavorite;
    });

    const collator = new Intl.Collator(language === 'zh' ? 'zh-Hans' : 'en', {
      numeric: true,
      sensitivity: 'base',
    });

    result.sort((left, right) => {
      const leftSuite = getLocalized(left.suite);
      const rightSuite = getLocalized(right.suite);
      const leftName = getLocalized(left.name);
      const rightName = getLocalized(right.name);

      if (sortBy === 'name') {
        return collator.compare(leftName, rightName);
      }

      if (sortBy === 'element') {
        return collator.compare(left.element || '', right.element || '') || left.id - right.id;
      }

      if (sortBy === 'arcana') {
        const leftOrder = SECTION_ORDER.get(left.suite?.en || leftSuite) ?? 99;
        const rightOrder = SECTION_ORDER.get(right.suite?.en || rightSuite) ?? 99;
        return leftOrder - rightOrder || left.id - right.id;
      }

      return left.id - right.id;
    });

    return result;
  }, [arcanaFilter, cards, elementFilter, favoriteCardIds, favoritesOnly, getLocalized, language, normalizedQuery, sortBy, suiteFilter]);

  const groupedSections = useMemo(() => {
    const sections = new Map();

    filteredCards.forEach((card) => {
      const sectionKey = card.suite?.en || getLocalized(card.suite);
      const sectionLabel = getLocalized(card.suite);
      const section = sections.get(sectionKey) || {
        key: sectionKey,
        label: sectionLabel,
        cards: [],
      };
      section.cards.push(card);
      sections.set(sectionKey, section);
    });

    return Array.from(sections.values()).sort((left, right) => {
      const leftOrder = SECTION_ORDER.get(left.key) ?? 99;
      const rightOrder = SECTION_ORDER.get(right.key) ?? 99;
      return leftOrder - rightOrder || left.label.localeCompare(right.label);
    });
  }, [filteredCards, getLocalized]);

  const favoriteCards = useMemo(() => favoriteCardIds.map((id) => cardMap.get(id)).filter(Boolean), [cardMap, favoriteCardIds]);
  const recentCards = useMemo(() => recentCardIds.map((id) => cardMap.get(id)).filter(Boolean), [cardMap, recentCardIds]);
  const compareCards = useMemo(() => compareCardIds.map((id) => cardMap.get(id)).filter(Boolean), [cardMap, compareCardIds]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [normalizedQuery, arcanaFilter, suiteFilter, elementFilter, sortBy, favoritesOnly]);

  useEffect(() => {
    if (!selectedCardId) {
      return;
    }

    if (!cardMap.has(selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [cardMap, selectedCardId]);

  useEffect(() => {
    setCompareCardIds((current) => current.filter((id) => cardMap.has(id)));
  }, [cardMap]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.displayMode, displayMode);
  }, [displayMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.density, density);
  }, [density]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.recentCardIds, JSON.stringify(recentCardIds));
  }, [recentCardIds]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.favoriteCardIds, JSON.stringify(favoriteCardIds));
  }, [favoriteCardIds]);

  const navigationCards = useMemo(() => {
    if (filteredCards.some((card) => card.id === selectedCardId)) {
      return filteredCards;
    }

    return allCardsSorted;
  }, [allCardsSorted, filteredCards, selectedCardId]);

  const selectedCardIndex = navigationCards.findIndex((card) => card.id === selectedCardId);
  const selectedCard = selectedCardId ? cardMap.get(selectedCardId) ?? null : null;
  const visibleCards = filteredCards.slice(0, visibleCount);
  const hasActiveFilters = Boolean(normalizedQuery) || arcanaFilter !== 'all' || suiteFilter !== 'all' || elementFilter !== 'all' || favoritesOnly;

  const densityClass = density === 'compact'
    ? 'w-[128px] h-[218px] md:w-[144px] md:h-[245px]'
    : 'w-[140px] h-[238px] md:w-[160px] md:h-[272px]';

  const openCard = (cardId) => {
    setSelectedCardId(cardId);
    setRecentCardIds((current) => [cardId, ...current.filter((item) => item !== cardId)].slice(0, RECENT_CARD_LIMIT));
  };

  const toggleFavorite = (cardId) => {
    setFavoriteCardIds((current) => (
      current.includes(cardId)
        ? current.filter((item) => item !== cardId)
        : [cardId, ...current.filter((item) => item !== cardId)]
    ));
  };

  const toggleCompare = (cardId) => {
    setCompareCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((item) => item !== cardId);
      }

      if (current.length >= COMPARE_CARD_LIMIT) {
        return current;
      }

      return [...current, cardId];
    });
  };

  const clearFilters = () => {
    setQuery('');
    setArcanaFilter('all');
    setSuiteFilter('all');
    setElementFilter('all');
    setSortBy('arcana');
    setFavoritesOnly(false);
  };

  const scrollToSection = (sectionKey) => {
    const targetElement = document.getElementById(createSectionId(sectionKey));
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCardTile = (card) => {
    const localizedName = getLocalized(card.name);
    const localizedSuite = getLocalized(card.suite);
    const elementLabel = elementLabelMap[card.element] || card.element || '';
    const isFavorite = favoriteCardIds.includes(card.id);
    const isCompared = compareCardIds.includes(card.id);
    const compareLimitReached = compareCardIds.length >= COMPARE_CARD_LIMIT && !isCompared;

    return (
      <article
        key={card.id}
        className="group w-full max-w-[188px] rounded-[28px] border border-white/8 bg-white/[0.03] p-3 text-left shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-tarot-gold/30 hover:bg-white/[0.05]"
      >
        <div className="mb-3 flex items-start justify-between gap-2 px-1">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] tracking-wide text-gray-300">
              #{card.id}
            </span>
            {elementLabel && (
              <span className="rounded-full bg-tarot-gold/10 px-2.5 py-1 text-[11px] tracking-wide text-tarot-gold">
                {elementLabel}
              </span>
            )}
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => toggleCompare(card.id)}
              disabled={compareLimitReached}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${isCompared ? 'border-sky-400/40 bg-sky-400/15 text-sky-200' : 'border-white/10 bg-black/20 text-gray-300 hover:border-sky-400/40 hover:text-sky-200'} ${compareLimitReached ? 'cursor-not-allowed opacity-40' : ''}`}
              aria-label={isCompared ? t('galleryCompareRemove') : t('galleryCompareAdd')}
              title={isCompared ? t('galleryCompareRemove') : t('galleryCompareAdd')}
            >
              {isCompared ? t('galleryCompareAddedShort') : t('galleryCompareAddShort')}
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(card.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-colors ${isFavorite ? 'border-amber-400/40 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-black/20 text-gray-300 hover:border-amber-400/40 hover:text-amber-200'}`}
              aria-label={isFavorite ? t('galleryFavoriteRemove') : t('galleryFavoriteAdd')}
              title={isFavorite ? t('galleryFavoriteRemove') : t('galleryFavoriteAdd')}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCard(card.id)}
          className="block w-full rounded-[22px] focus:outline-none focus:ring-2 focus:ring-tarot-gold/40"
        >
          <Card
            card={card}
            isFlipped
            language={language}
            interactive={false}
            floating={false}
            className={`${densityClass} mx-auto`}
          />

          <div className="mt-3 space-y-1 px-1 text-left">
            <div className="line-clamp-1 text-sm font-semibold text-white">{localizedName}</div>
            <div className="line-clamp-1 text-xs text-gray-400">{localizedSuite}</div>
          </div>
        </button>
      </article>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-10 pt-4 md:px-6">
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-tarot-gold/70">
              {t('galleryEyebrow')}
            </p>
            <h2 className="text-3xl text-tarot-gold font-serif drop-shadow-md md:text-4xl">
              {t('galleryTitle')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300 md:text-base">
              {t('gallerySubtitle')}
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-gray-200 sm:grid-cols-3 sm:gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryStatTotal')}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{cards.length}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryStatVisible')}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{filteredCards.length}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryStatShowing')}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{displayMode === 'grouped' ? filteredCards.length : visibleCards.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-4 z-20 mb-6 rounded-3xl border border-white/10 bg-[#0b1020]/90 p-4 shadow-xl shadow-black/20 backdrop-blur md:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-black/20 p-2">
          <span className="px-2 text-xs uppercase tracking-[0.3em] text-gray-500">{t('galleryModeLabel')}</span>
          <button
            type="button"
            onClick={() => setDisplayMode('grid')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${displayMode === 'grid' ? 'bg-tarot-gold text-black' : 'text-gray-300 hover:text-white'}`}
          >
            {t('galleryViewGrid')}
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('grouped')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${displayMode === 'grouped' ? 'bg-tarot-gold text-black' : 'text-gray-300 hover:text-white'}`}
          >
            {t('galleryViewGrouped')}
          </button>
          <button
            type="button"
            onClick={() => setFavoritesOnly((current) => !current)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${favoritesOnly ? 'bg-amber-300 text-black' : 'text-gray-300 hover:text-white'}`}
          >
            {t('galleryFavoritesOnly')}
          </button>
          <span className="ml-auto hidden text-sm text-gray-400 lg:block">
            {displayMode === 'grouped' ? t('galleryGroupedHint') : t('galleryGridHint')}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr),repeat(4,minmax(0,1fr))]">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('gallerySearchLabel')}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('gallerySearchPlaceholder')}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-tarot-gold/50"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryArcanaLabel')}</span>
            <select
              value={arcanaFilter}
              onChange={(event) => setArcanaFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-tarot-gold/50"
            >
              <option value="all">{t('galleryFilterAll')}</option>
              <option value="major">{t('galleryArcanaMajor')}</option>
              <option value="minor">{t('galleryArcanaMinor')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('gallerySuiteLabel')}</span>
            <select
              value={suiteFilter}
              onChange={(event) => setSuiteFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-tarot-gold/50"
            >
              <option value="all">{t('galleryFilterAll')}</option>
              {suiteOptions.map((suite) => (
                <option key={suite} value={suite}>{suite}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryElementLabel')}</span>
            <select
              value={elementFilter}
              onChange={(event) => setElementFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-tarot-gold/50"
            >
              <option value="all">{t('galleryFilterAll')}</option>
              {elementOptions.map((element) => (
                <option key={element} value={element}>{elementLabelMap[element] || element}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('gallerySortLabel')}</span>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-tarot-gold/50"
              >
                <option value="arcana">{t('gallerySortArcana')}</option>
                <option value="name">{t('gallerySortName')}</option>
                <option value="element">{t('gallerySortElement')}</option>
                <option value="id">{t('gallerySortId')}</option>
              </select>
              <button
                type="button"
                onClick={() => setDensity((current) => (current === 'compact' ? 'comfortable' : 'compact'))}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
              >
                {density === 'compact' ? t('galleryDensityCompact') : t('galleryDensityComfortable')}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-4 py-2 text-sm text-tarot-gold transition-colors hover:border-tarot-gold/50 hover:bg-tarot-gold/15"
            >
              {t('galleryClearFilters')}
            </button>
          )}
          <span className="text-sm text-gray-400">
            {t('galleryResultsPrefix')} <span className="text-white">{filteredCards.length}</span> / {cards.length}
          </span>
        </div>
      </div>

      {compareCards.length > 0 && (
        <section className="mb-6 rounded-3xl border border-sky-400/15 bg-sky-400/5 p-4 shadow-xl shadow-black/10 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-serif text-sky-200">{t('galleryCompareTitle')}</h3>
              <p className="mt-1 text-sm text-sky-50/75">{t('galleryCompareHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setCompareCardIds([])}
              className="rounded-full border border-sky-300/20 bg-black/20 px-4 py-2 text-sm text-sky-100 transition-colors hover:border-sky-300/40"
            >
              {t('galleryCompareClear')}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-sky-50/80">
            <span className="rounded-full border border-sky-300/20 bg-black/20 px-3 py-1.5">
              {t('galleryCompareCounter')} {compareCards.length}/{COMPARE_CARD_LIMIT}
            </span>
            {compareCards.length < 2 && (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-gray-300">
                {t('galleryCompareNeedMore')}
              </span>
            )}
          </div>

          <div className="mb-4 flex gap-4 overflow-x-auto pb-2">
            {compareCards.map((card) => (
              <div key={card.id} className="min-w-[164px] rounded-[24px] border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="line-clamp-1 text-sm font-medium text-white">{getLocalized(card.name)}</div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(card.id)}
                    className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-sky-300/40 hover:text-sky-200"
                  >
                    ×
                  </button>
                </div>
                <button type="button" onClick={() => openCard(card.id)} className="block w-full text-left">
                  <Card
                    card={card}
                    isFlipped
                    language={language}
                    interactive={false}
                    floating={false}
                    className="h-[204px] w-[120px] mx-auto"
                  />
                </button>
              </div>
            ))}
          </div>

          <div className={`grid gap-4 ${compareCards.length >= 3 ? 'xl:grid-cols-3' : compareCards.length === 2 ? 'xl:grid-cols-2' : ''}`}>
            {compareCards.map((card) => (
              <article key={card.id} className="rounded-3xl border border-white/10 bg-[#08101c] p-5 shadow-lg shadow-black/10">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-lg font-serif text-white">{getLocalized(card.name)}</h4>
                    <p className="mt-1 text-sm text-gray-400">{getLocalized(card.suite)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCard(card.id)}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
                  >
                    {t('viewDetails')}
                  </button>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                    <div className="mb-2 text-sm font-medium text-emerald-200">{t('upright')}</div>
                    <p className="text-sm leading-6 text-gray-200">{getLocalized(card.meaning_upright)}</p>
                  </section>
                  <section className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                    <div className="mb-2 text-sm font-medium text-rose-200">{t('reversed')}</div>
                    <p className="text-sm leading-6 text-gray-200">{getLocalized(card.meaning_reversed)}</p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {favoriteCards.length > 0 && !favoritesOnly && (
        <section className="mb-6 rounded-3xl border border-amber-400/15 bg-amber-400/5 p-4 shadow-xl shadow-black/10 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-serif text-amber-200">{t('galleryFavoritesTitle')}</h3>
              <p className="mt-1 text-sm text-amber-50/80">{t('galleryFavoritesHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setFavoritesOnly(true)}
              className="rounded-full border border-amber-300/20 bg-black/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:border-amber-300/40"
            >
              {t('galleryFavoritesOnly')}
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {favoriteCards.map((card) => (
              <article key={card.id} className="min-w-[164px] rounded-[24px] border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="line-clamp-1 text-sm font-medium text-white">{getLocalized(card.name)}</div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(card.id)}
                    className="rounded-full border border-amber-300/20 bg-amber-400/15 px-2 py-1 text-xs text-amber-100 transition-colors hover:border-amber-300/40"
                    title={t('galleryFavoriteRemove')}
                    aria-label={t('galleryFavoriteRemove')}
                  >
                    ★
                  </button>
                </div>
                <button type="button" onClick={() => openCard(card.id)} className="block w-full text-left">
                  <Card
                    card={card}
                    isFlipped
                    language={language}
                    interactive={false}
                    floating={false}
                    className="h-[204px] w-[120px] mx-auto"
                  />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {recentCards.length > 0 && (
        <section className="mb-6 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-xl shadow-black/10 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-serif text-tarot-gold">{t('galleryRecentTitle')}</h3>
              <p className="mt-1 text-sm text-gray-400">{t('galleryRecentHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setRecentCardIds([])}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
            >
              {t('galleryRecentClear')}
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentCards.map((card) => (
              <article key={card.id} className="min-w-[146px] rounded-[24px] border border-white/8 bg-black/20 p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-tarot-gold/30">
                <button type="button" onClick={() => openCard(card.id)} className="block w-full text-left">
                  <Card
                    card={card}
                    isFlipped
                    language={language}
                    interactive={false}
                    floating={false}
                    className="h-[204px] w-[120px] mx-auto"
                  />
                  <div className="mt-3 line-clamp-1 text-sm font-medium text-white">{getLocalized(card.name)}</div>
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {displayMode === 'grouped' && groupedSections.length > 1 && (
        <div className="mb-6 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-lg shadow-black/10">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500">{t('galleryQuickJumpTitle')}</div>
          <div className="flex flex-wrap gap-2">
            {groupedSections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => scrollToSection(section.key)}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredCards.length > 0 ? (
        displayMode === 'grouped' ? (
          <div className="space-y-8">
            {groupedSections.map((section) => {
              const sectionCountLabel = [t('gallerySectionPrefix'), section.cards.length, t('gallerySectionSuffix')].filter(Boolean).join(' ');

              return (
                <section id={createSectionId(section.key)} key={section.key} className="scroll-mt-28 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-xl shadow-black/10 md:p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div>
                      <h3 className="text-2xl font-serif text-tarot-gold">{section.label}</h3>
                      <p className="mt-1 text-sm text-gray-400">{sectionCountLabel}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs tracking-[0.25em] text-gray-300">
                      {section.key}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 justify-items-center sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {section.cards.map(renderCardTile)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 justify-items-center sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {visibleCards.map(renderCardTile)}
            </div>

            {visibleCards.length < filteredCards.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, filteredCards.length))}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
                >
                  {t('galleryLoadMore')} ({visibleCards.length}/{filteredCards.length})
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <h3 className="text-2xl font-serif text-tarot-gold">{t('galleryEmptyTitle')}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400 md:text-base">
            {t('galleryEmptyHint')}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-5 py-3 text-sm text-tarot-gold transition-colors hover:border-tarot-gold/50 hover:bg-tarot-gold/15"
          >
            {t('galleryClearFilters')}
          </button>
        </div>
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          language={language}
          onClose={() => setSelectedCardId(null)}
          onPrev={selectedCardIndex > 0 ? () => openCard(navigationCards[selectedCardIndex - 1].id) : null}
          onNext={selectedCardIndex < navigationCards.length - 1 ? () => openCard(navigationCards[selectedCardIndex + 1].id) : null}
          hasPrev={selectedCardIndex > 0}
          hasNext={selectedCardIndex < navigationCards.length - 1}
          progressLabel={`${selectedCardIndex + 1} / ${navigationCards.length}`}
          t={t}
        />
      )}
    </div>
  );
};

export default Gallery;
