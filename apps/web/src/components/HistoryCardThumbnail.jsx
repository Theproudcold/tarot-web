import React from 'react';
import { resolveAssetPath } from '../lib/assetPaths.js';
import { getLocalized, getOrientationLabel, readingSlots } from '../lib/tarotReading.js';

const orientationBadge = (card, language) => {
  if (card?.isReversed) {
    return language === 'zh' ? '逆' : 'REV';
  }

  return language === 'zh' ? '正' : 'UP';
};

const HistoryCardThumbnail = ({ card, index = 0, language = 'en', t, className = '' }) => {
  if (!card) return null;

  const slotKey = readingSlots[index] || null;
  const slotLabel = slotKey ? t(slotKey) : `${index + 1}`;
  const title = getLocalized(card.name, language);
  const orientationLabel = getOrientationLabel(card, language);
  const badge = orientationBadge(card, language);

  return (
    <div
      className={`w-[68px] shrink-0 sm:w-[76px] ${className}`.trim()}
      title={`${slotLabel} · ${title} · ${orientationLabel}`}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-[1.1rem] border border-tarot-gold/25 bg-black/40 shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: card.image_placeholder_color || 'rgba(17, 24, 39, 0.8)' }}
      >
        <img
          src={resolveAssetPath(card.image)}
          alt={`${title} · ${orientationLabel}`}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover object-top transition-transform duration-300 ${card.isReversed ? 'rotate-180 scale-[1.08]' : 'scale-[1.06]'}`}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
          <span className="rounded-full border border-tarot-gold/35 bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-tarot-gold backdrop-blur-sm">
            {slotLabel}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] backdrop-blur-sm ${card.isReversed ? 'border border-rose-400/35 bg-rose-500/20 text-rose-100' : 'border border-emerald-400/35 bg-emerald-500/15 text-emerald-100'}`}>
            {badge}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-[11px] font-medium text-white/95">{title}</p>
        <p className="mt-0.5 text-[10px] text-gray-400">{orientationLabel}</p>
      </div>
    </div>
  );
};

export default HistoryCardThumbnail;
