import React from 'react';
import Card from '../Card';

const GalleryFavoritesPanel = ({ favoriteCards, favoritesOnly, getLocalized, language, onOpenCard, onToggleFavorite, onFavoritesOnlyToggle, t }) => {
  if (favoriteCards.length === 0 || favoritesOnly) {
    return null;
  }

  return (
    <section className="mb-6 rounded-3xl border border-amber-400/15 bg-amber-400/5 p-4 shadow-xl shadow-black/10 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-amber-200">{t('galleryFavoritesTitle')}</h3>
          <p className="mt-1 text-sm text-amber-50/80">{t('galleryFavoritesHint')}</p>
        </div>
        <button
          type="button"
          onClick={onFavoritesOnlyToggle}
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
                onClick={() => onToggleFavorite(card.id)}
                className="rounded-full border border-amber-300/20 bg-amber-400/15 px-2 py-1 text-xs text-amber-100 transition-colors hover:border-amber-300/40"
                title={t('galleryFavoriteRemove')}
                aria-label={t('galleryFavoriteRemove')}
              >
                ★
              </button>
            </div>
            <button type="button" onClick={() => onOpenCard(card.id)} className="block w-full text-left">
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
  );
};

export default GalleryFavoritesPanel;
