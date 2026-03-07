import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CardDetailModal from './CardDetailModal';
import GalleryCardTile from './gallery/GalleryCardTile';
import GalleryComparePanel from './gallery/GalleryComparePanel';
import GalleryFavoritesPanel from './gallery/GalleryFavoritesPanel';
import GalleryGroupedSections from './gallery/GalleryGroupedSections';
import GalleryQuickJump from './gallery/GalleryQuickJump';
import GalleryRecentPanel from './gallery/GalleryRecentPanel';
import GalleryToolbar from './gallery/GalleryToolbar';
import {
  COMPARE_CARD_LIMIT,
  INITIAL_VISIBLE_COUNT,
  LOAD_MORE_STEP,
  MAJOR_ARCANA_SUITS,
  RECENT_CARD_LIMIT,
  SECTION_ORDER,
  STORAGE_KEYS,
  createSectionId,
} from './gallery/constants.js';
import { readStoredJson, readStoredValue } from './gallery/storage.js';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
      if (sortBy === 'favorites') {
        const favoriteDelta = Number(favoriteCardIds.includes(right.id)) - Number(favoriteCardIds.includes(left.id));
        return favoriteDelta || left.id - right.id;
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
      const currentSection = sections.get(sectionKey) || { key: sectionKey, label: sectionLabel, cards: [] };
      currentSection.cards.push(card);
      sections.set(sectionKey, currentSection);
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.displayMode, displayMode);
    }
  }, [displayMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.density, density);
    }
  }, [density]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.recentCardIds, JSON.stringify(recentCardIds));
    }
  }, [recentCardIds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.favoriteCardIds, JSON.stringify(favoriteCardIds));
    }
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
  const activeFilterCount = [
    Boolean(normalizedQuery),
    arcanaFilter !== 'all',
    suiteFilter !== 'all',
    elementFilter !== 'all',
    favoritesOnly,
    sortBy !== 'arcana',
  ].filter(Boolean).length;
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

  const toggleCompare = (cardId, clearAll = false) => {
    if (clearAll) {
      setCompareCardIds([]);
      return;
    }

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
    setMobileFiltersOpen(false);
  };

  const scrollToSection = (sectionKey) => {
    const targetElement = document.getElementById(createSectionId(sectionKey));
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCardTile = useCallback((card) => {
    const localizedName = getLocalized(card.name);
    const localizedSuite = getLocalized(card.suite);
    const elementLabel = elementLabelMap[card.element] || card.element || '';
    const isFavorite = favoriteCardIds.includes(card.id);
    const isCompared = compareCardIds.includes(card.id);
    const compareLimitReached = compareCardIds.length >= COMPARE_CARD_LIMIT && !isCompared;

    return (
      <GalleryCardTile
        key={card.id}
        card={card}
        language={language}
        densityClass={densityClass}
        elementLabel={elementLabel}
        localizedName={localizedName}
        localizedSuite={localizedSuite}
        isFavorite={isFavorite}
        isCompared={isCompared}
        compareLimitReached={compareLimitReached}
        onOpenCard={openCard}
        onToggleCompare={toggleCompare}
        onToggleFavorite={toggleFavorite}
        t={t}
      />
    );
  }, [compareCardIds, densityClass, elementLabelMap, favoriteCardIds, getLocalized, language, t]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-10 pt-4 md:px-6">
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-tarot-gold/70">{t('galleryEyebrow')}</p>
            <h2 className="text-3xl text-tarot-gold font-serif drop-shadow-md md:text-4xl">{t('galleryTitle')}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300 md:text-base">{t('gallerySubtitle')}</p>
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

      <GalleryToolbar
        t={t}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyToggle={() => setFavoritesOnly((current) => !current)}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersToggle={() => setMobileFiltersOpen((current) => !current)}
        activeFilterCount={activeFilterCount}
        filteredCardsCount={filteredCards.length}
        totalCardsCount={cards.length}
        favoriteCardsCount={favoriteCards.length}
        compareCardsCount={compareCards.length}
        compareCardLimit={COMPARE_CARD_LIMIT}
        query={query}
        onQueryChange={setQuery}
        arcanaFilter={arcanaFilter}
        onArcanaFilterChange={setArcanaFilter}
        suiteOptions={suiteOptions}
        suiteFilter={suiteFilter}
        onSuiteFilterChange={setSuiteFilter}
        elementOptions={elementOptions}
        elementFilter={elementFilter}
        onElementFilterChange={setElementFilter}
        elementLabelMap={elementLabelMap}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        density={density}
        onDensityToggle={() => setDensity((current) => (current === 'compact' ? 'comfortable' : 'compact'))}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <GalleryComparePanel
        compareCards={compareCards}
        compareCardLimit={COMPARE_CARD_LIMIT}
        getLocalized={getLocalized}
        language={language}
        onOpenCard={openCard}
        onToggleCompare={toggleCompare}
        t={t}
      />

      <GalleryFavoritesPanel
        favoriteCards={favoriteCards}
        favoritesOnly={favoritesOnly}
        getLocalized={getLocalized}
        language={language}
        onOpenCard={openCard}
        onToggleFavorite={toggleFavorite}
        onFavoritesOnlyToggle={() => setFavoritesOnly(true)}
        t={t}
      />

      <GalleryRecentPanel
        recentCards={recentCards}
        getLocalized={getLocalized}
        language={language}
        onOpenCard={openCard}
        onClearRecent={() => setRecentCardIds([])}
        t={t}
      />

      {displayMode === 'grouped' && (
        <GalleryQuickJump sections={groupedSections} onJumpToSection={scrollToSection} t={t} />
      )}

      {filteredCards.length > 0 ? (
        displayMode === 'grouped' ? (
          <GalleryGroupedSections sections={groupedSections} renderCardTile={renderCardTile} t={t} />
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
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400 md:text-base">{t('galleryEmptyHint')}</p>
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
          isFavorite={favoriteCardIds.includes(selectedCard.id)}
          isCompared={compareCardIds.includes(selectedCard.id)}
          compareLimitReached={compareCardIds.length >= COMPARE_CARD_LIMIT && !compareCardIds.includes(selectedCard.id)}
          onToggleFavorite={() => toggleFavorite(selectedCard.id)}
          onToggleCompare={() => toggleCompare(selectedCard.id)}
          progressLabel={`${selectedCardIndex + 1} / ${navigationCards.length}`}
          t={t}
        />
      )}
    </div>
  );
};

export default Gallery;
