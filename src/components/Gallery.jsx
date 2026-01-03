import React, { useState } from 'react';
import Card from './Card';
import CardDetailModal from './CardDetailModal';

const Gallery = ({ cards, language = 'en' }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-fadeIn">
      <h2 className="text-3xl text-tarot-gold font-serif mb-8 drop-shadow-md">
        {language === 'zh' ? '全牌预览' : 'Card Gallery'}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
        {cards.map(card => (
          <div key={card.id} className="transform hover:-translate-y-2 transition-transform duration-300">
            <Card
              card={card}
              isFlipped={true}
              language={language}
              onClick={() => setSelectedCard(card)}
              style={{ width: '160px', height: '272px', margin: 0 }} // Slightly smaller for gallery
            />
            <div className="mt-2 text-sm text-gray-400 font-serif opacity-70">
              {/* Optional label below card if needed, but Card face has name already */}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Details */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          language={language}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

export default Gallery;
