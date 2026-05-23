import React from 'react';
import Card from '../Card';

const GalleryRecentPanel = ({ recentCards, getLocalized, language, onOpenCard, onClearRecent, t }) => {
  if (recentCards.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-xl shadow-black/10 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-tarot-gold">{t('galleryRecentTitle')}</h3>
          <p className="mt-1 text-sm text-gray-400">{t('galleryRecentHint')}</p>
        </div>
        <button
          type="button"
          onClick={onClearRecent}
          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
        >
          {t('galleryRecentClear')}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {recentCards.map((card) => (
          <article key={card.id} className="min-w-[146px] rounded-[24px] border border-white/8 bg-black/20 p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-tarot-gold/30">
            <button type="button" onClick={() => onOpenCard(card.id)} className="block w-full text-left">
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
  );
};

export default GalleryRecentPanel;
