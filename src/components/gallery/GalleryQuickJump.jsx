import React from 'react';

const GalleryQuickJump = ({ sections, onJumpToSection, t }) => {
  if (sections.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-lg shadow-black/10">
      <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500">{t('galleryQuickJumpTitle')}</div>
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => onJumpToSection(section.key)}
            className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold"
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GalleryQuickJump;
