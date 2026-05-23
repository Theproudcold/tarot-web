import React from 'react';

const GalleryToolbar = ({
  t,
  displayMode,
  onDisplayModeChange,
  favoritesOnly,
  onFavoritesOnlyToggle,
  mobileFiltersOpen,
  onMobileFiltersToggle,
  activeFilterCount,
  filteredCardsCount,
  totalCardsCount,
  favoriteCardsCount,
  compareCardsCount,
  compareCardLimit,
  query,
  onQueryChange,
  arcanaFilter,
  onArcanaFilterChange,
  suiteOptions,
  suiteFilter,
  onSuiteFilterChange,
  elementOptions,
  elementFilter,
  onElementFilterChange,
  elementLabelMap,
  sortBy,
  onSortByChange,
  density,
  onDensityToggle,
  hasActiveFilters,
  onClearFilters,
}) => (
  <div className="sticky top-4 z-20 mb-6 rounded-3xl border border-white/10 bg-[#0b1020]/90 p-4 shadow-xl shadow-black/20 backdrop-blur md:p-5">
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-black/20 p-2">
      <span className="px-2 text-xs uppercase tracking-[0.3em] text-gray-500">{t('galleryModeLabel')}</span>
      <button
        type="button"
        onClick={() => onDisplayModeChange('grid')}
        className={`rounded-full px-4 py-2 text-sm transition-colors ${displayMode === 'grid' ? 'bg-tarot-gold text-black' : 'text-gray-300 hover:text-white'}`}
      >
        {t('galleryViewGrid')}
      </button>
      <button
        type="button"
        onClick={() => onDisplayModeChange('grouped')}
        className={`rounded-full px-4 py-2 text-sm transition-colors ${displayMode === 'grouped' ? 'bg-tarot-gold text-black' : 'text-gray-300 hover:text-white'}`}
      >
        {t('galleryViewGrouped')}
      </button>
      <button
        type="button"
        onClick={onFavoritesOnlyToggle}
        className={`rounded-full px-4 py-2 text-sm transition-colors ${favoritesOnly ? 'bg-amber-300 text-black' : 'text-gray-300 hover:text-white'}`}
      >
        {t('galleryFavoritesOnly')}
      </button>
      <button
        type="button"
        onClick={onMobileFiltersToggle}
        className="ml-auto rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold md:hidden"
      >
        {mobileFiltersOpen ? t('galleryFiltersClose') : t('galleryFiltersOpen')}
        <span className="ml-2 rounded-full bg-tarot-gold/15 px-2 py-0.5 text-xs text-tarot-gold">{activeFilterCount}</span>
      </button>
      <span className="ml-auto hidden text-sm text-gray-400 lg:block">
        {displayMode === 'grouped' ? t('galleryGroupedHint') : t('galleryGridHint')}
      </span>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-2 md:hidden">
      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-300">
        {t('galleryResultsPrefix')} {filteredCardsCount}
      </span>
      <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100">
        {t('galleryFavoritesTitle')} {favoriteCardsCount}
      </span>
      <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-100">
        {t('galleryCompareTitle')} {compareCardsCount}/{compareCardLimit}
      </span>
    </div>

    <div className={`${mobileFiltersOpen ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr),repeat(4,minmax(0,1fr))]`}>
      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('gallerySearchLabel')}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('gallerySearchPlaceholder')}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-tarot-gold/50"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{t('galleryArcanaLabel')}</span>
        <select
          value={arcanaFilter}
          onChange={(event) => onArcanaFilterChange(event.target.value)}
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
          onChange={(event) => onSuiteFilterChange(event.target.value)}
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
          onChange={(event) => onElementFilterChange(event.target.value)}
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
            onChange={(event) => onSortByChange(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-tarot-gold/50"
          >
            <option value="arcana">{t('gallerySortArcana')}</option>
            <option value="name">{t('gallerySortName')}</option>
            <option value="element">{t('gallerySortElement')}</option>
            <option value="favorites">{t('gallerySortFavorites')}</option>
            <option value="id">{t('gallerySortId')}</option>
          </select>
          <button
            type="button"
            onClick={onDensityToggle}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
          >
            {density === 'compact' ? t('galleryDensityCompact') : t('galleryDensityComfortable')}
          </button>
        </div>
      </label>
    </div>

    <div className={`${mobileFiltersOpen ? 'mt-4 flex' : 'hidden'} flex-wrap items-center gap-2 md:mt-4 md:flex`}>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-4 py-2 text-sm text-tarot-gold transition-colors hover:border-tarot-gold/50 hover:bg-tarot-gold/15"
        >
          {t('galleryClearFilters')}
        </button>
      )}
      <span className="text-sm text-gray-400">
        {t('galleryResultsPrefix')} <span className="text-white">{filteredCardsCount}</span> / {totalCardsCount}
      </span>
    </div>
  </div>
);

export default GalleryToolbar;
