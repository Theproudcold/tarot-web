import React, { useEffect } from 'react';

import Card from './Card'; // Import Card component

const CardDetailModal = ({ card, onClose, language = 'en' }) => {
  if (!card) return null;

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getLocalized = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj['en'] || '';
  };

  const labels = {
    en: { upright: "Upright", reversed: "Reversed" },
    zh: { upright: "正位", reversed: "逆位" }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl bg-tarot-dark border-2 border-tarot-gold rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-tarot-gold/20 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-tarot-gold hover:text-white z-10 text-3xl leading-none"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Left: Image Area */}
        <div className="md:w-1/2 h-[40vh] md:h-auto bg-black flex items-center justify-center relative overflow-hidden p-8">
          {/* Background glow */}
          <div className="absolute inset-0 bg-radial-[at_50%_50%] from-tarot-gold/10 to-transparent blur-xl"></div>

          {/* Render the actual Card component for perfect fidelity */}
          <div className="transform scale-125 md:scale-100">
            <Card
              card={card}
              isFlipped={true}
              language={language}
              style={{ width: '240px', height: '408px', margin: 0, cursor: 'default' }} // Larger size for modal
            />
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto bg-tarot-bg/50 text-left">
          <h2 className="text-4xl text-tarot-gold font-serif mb-2">{getLocalized(card.name)}</h2>
          <p className="text-gray-400 uppercase tracking-widest text-sm mb-8 pb-4 border-b border-gray-700">
            {getLocalized(card.suite)}
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl text-white font-serif mb-2 flex items-center gap-2">
                <span className="text-tarot-gold text-2xl">↑</span> {labels[language].upright}
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                {getLocalized(card.meaning_upright)}
              </p>
            </div>

            <div>
              <h3 className="text-xl text-white font-serif mb-2 flex items-center gap-2">
                <span className="text-tarot-gold text-2xl">↓</span> {labels[language].reversed}
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                {getLocalized(card.meaning_reversed)}
              </p>
            </div>

            {/* Description (Flavor text placeholder if we had it) */}
            <div className="bg-white/5 p-4 rounded-lg mt-6">
              <p className="italic text-gray-500 text-sm">
                Card #{card.id} - {language === 'zh' ? '点击遮罩关闭' : 'Click outside to close'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
