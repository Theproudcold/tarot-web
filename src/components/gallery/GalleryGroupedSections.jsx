import React from 'react';
import { createSectionId } from './constants.js';

const GalleryGroupedSections = ({ sections, renderCardTile, t }) => (
  <div className="space-y-8">
    {sections.map((section) => {
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
);

export default GalleryGroupedSections;
