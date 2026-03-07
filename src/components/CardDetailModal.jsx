import React, { useEffect } from 'react';

import Card from './Card';

const CardDetailModal = ({
  card,
  onClose,
  language = 'en',
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isFavorite = false,
  isCompared = false,
  compareLimitReached = false,
  onToggleFavorite,
  onToggleCompare,
  progressLabel = '',
  t = (key) => key,
}) => {
  useEffect(() => {
    if (!card) {
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
      if (event.key === 'ArrowLeft' && hasPrev) {
        onPrev?.();
      }
      if (event.key === 'ArrowRight' && hasNext) {
        onNext?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [card, hasNext, hasPrev, onClose, onNext, onPrev]);

  if (!card) return null;

  const getLocalized = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj?.[language] || obj?.en || '';
  };

  const labels = {
    en: { upright: 'Upright', reversed: 'Reversed' },
    zh: { upright: '正位', reversed: '逆位' },
  };

  const localizedSuite = getLocalized(card.suite);
  const localizedElement = card.element
    ? {
      Fire: t('galleryElementFire'),
      Water: t('galleryElementWater'),
      Air: t('galleryElementAir'),
      Earth: t('galleryElementEarth'),
    }[card.element] || card.element
    : '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md md:items-center md:p-4" onClick={onClose}>
      <div
        className="relative my-4 w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0a1020] shadow-2xl shadow-black/40 md:max-h-[calc(100dvh-2rem)] md:overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/25 text-2xl leading-none text-tarot-gold transition-colors hover:border-tarot-gold/40 hover:text-white"
          onClick={onClose}
          aria-label={t('closeModal')}
        >
          &times;
        </button>

        <div className="flex flex-col md:grid md:max-h-[calc(100dvh-2rem)] md:grid-cols-[minmax(280px,0.95fr),minmax(0,1.05fr)]">
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden border-b border-white/10 bg-black/40 px-6 py-8 sm:min-h-[340px] md:min-h-0 md:border-b-0 md:border-r md:border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_55%)]" />
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs tracking-[0.25em] text-gray-300">
              #{card.id}
            </div>
            {progressLabel && (
              <div className="absolute bottom-4 left-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs tracking-[0.2em] text-gray-300">
                {progressLabel}
              </div>
            )}

            <div className="relative z-10">
              <Card
                card={card}
                isFlipped
                language={language}
                interactive={false}
                floating={false}
                className="h-[289px] w-[170px] sm:h-[340px] sm:w-[200px] lg:h-[408px] lg:w-[240px]"
                style={{ cursor: 'default' }}
              />
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/25 text-xl text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t('galleryPreviousCard')}
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/25 text-xl text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t('galleryNextCard')}
              >
                →
              </button>
            </div>
          </div>

          <div className="overflow-y-visible bg-tarot-bg/35 p-6 text-left md:overflow-y-auto md:p-8 lg:p-10">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6 pr-12">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.35em] text-tarot-gold/70">{t('galleryDetailEyebrow')}</p>
                <h2 className="text-3xl font-serif text-tarot-gold md:text-4xl">{getLocalized(card.name)}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-300">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{localizedSuite}</span>
                  {localizedElement && (
                    <span className="rounded-full border border-tarot-gold/20 bg-tarot-gold/10 px-3 py-1.5 text-tarot-gold">{localizedElement}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onToggleCompare}
                  disabled={!onToggleCompare || compareLimitReached}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${isCompared ? 'border-sky-400/40 bg-sky-400/15 text-sky-100' : 'border-white/10 bg-black/20 text-gray-300 hover:border-sky-300/40 hover:text-sky-100'} ${compareLimitReached ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {isCompared ? t('galleryCompareRemove') : t('galleryCompareAdd')}
                </button>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  disabled={!onToggleFavorite}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${isFavorite ? 'border-amber-300/30 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-black/20 text-gray-300 hover:border-amber-300/40 hover:text-amber-100'}`}
                >
                  {isFavorite ? t('galleryFavoriteRemove') : t('galleryFavoriteAdd')}
                </button>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-serif text-white">
                  <span className="text-xl text-emerald-300">↑</span>
                  {labels[language].upright}
                </h3>
                <p className="text-sm leading-7 text-gray-200 md:text-base">
                  {getLocalized(card.meaning_upright)}
                </p>
              </section>

              <section className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-serif text-white">
                  <span className="text-xl text-rose-300">↓</span>
                  {labels[language].reversed}
                </h3>
                <p className="text-sm leading-7 text-gray-200 md:text-base">
                  {getLocalized(card.meaning_reversed)}
                </p>
              </section>
            </div>

            <div className="mt-6 rounded-2xl border border-white/8 bg-black/15 p-4 text-sm leading-6 text-gray-400">
              {t('galleryModalHint')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
