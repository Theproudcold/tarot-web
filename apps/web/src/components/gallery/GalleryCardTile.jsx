import React from 'react';
import Card from '../Card';

const GalleryCardTile = ({
  card,
  language,
  densityClass,
  elementLabel,
  localizedName,
  localizedSuite,
  isFavorite,
  isCompared,
  compareLimitReached,
  onOpenCard,
  onToggleCompare,
  onToggleFavorite,
  t,
}) => (
  <article className="group w-full max-w-[188px] rounded-[28px] border border-white/8 bg-white/[0.03] p-3 text-left shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-tarot-gold/30 hover:bg-white/[0.05]">
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
          onClick={() => onToggleCompare(card.id)}
          disabled={compareLimitReached}
          className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${isCompared ? 'border-sky-400/40 bg-sky-400/15 text-sky-200' : 'border-white/10 bg-black/20 text-gray-300 hover:border-sky-400/40 hover:text-sky-200'} ${compareLimitReached ? 'cursor-not-allowed opacity-40' : ''}`}
          aria-label={isCompared ? t('galleryCompareRemove') : t('galleryCompareAdd')}
          title={isCompared ? t('galleryCompareRemove') : t('galleryCompareAdd')}
        >
          {isCompared ? t('galleryCompareAddedShort') : t('galleryCompareAddShort')}
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(card.id)}
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
      onClick={() => onOpenCard(card.id)}
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

export default GalleryCardTile;
