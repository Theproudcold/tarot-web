import React from 'react';
import Card from '../Card';

const GalleryComparePanel = ({ compareCards, compareCardLimit, getLocalized, language, onOpenCard, onToggleCompare, t }) => {
  if (compareCards.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-3xl border border-sky-400/15 bg-sky-400/5 p-4 shadow-xl shadow-black/10 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-sky-200">{t('galleryCompareTitle')}</h3>
          <p className="mt-1 text-sm text-sky-50/75">{t('galleryCompareHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleCompare(null, true)}
          className="rounded-full border border-sky-300/20 bg-black/20 px-4 py-2 text-sm text-sky-100 transition-colors hover:border-sky-300/40"
        >
          {t('galleryCompareClear')}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-sky-50/80">
        <span className="rounded-full border border-sky-300/20 bg-black/20 px-3 py-1.5">
          {t('galleryCompareCounter')} {compareCards.length}/{compareCardLimit}
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
                onClick={() => onToggleCompare(card.id)}
                className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-sky-300/40 hover:text-sky-200"
              >
                ×
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
                onClick={() => onOpenCard(card.id)}
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
  );
};

export default GalleryComparePanel;
