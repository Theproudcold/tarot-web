import React from 'react';
import Card from './Card';

const Spread = ({ cards, language = 'en' }) => {
  const headings = {
    en: ['Past', 'Present', 'Future'],
    zh: ['过去', '现在', '未来']
  };

  return (
    <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 min-h-[400px] w-full items-center">
      {cards.map((card, index) => (
        <div key={card.id || index} className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: `${index * 0.2}s` }}>
          <h4 className="text-tarot-gold mb-2 font-serif text-xl tracking-wide">{headings[language][index]}</h4>
          <Card
            card={card}
            isFlipped={true}
            language={language}
          />
        </div>
      ))}
      {[...Array(3 - cards.length)].map((_, i) => (
        <div key={`empty-${i}`} className="flex flex-col items-center justify-center opacity-30">
          <h4 className="text-tarot-gold/50 mb-2 font-serif text-xl tracking-wide">{headings[language][cards.length + i]}</h4>
          <div className="w-[200px] h-[340px] border-2 border-dashed border-tarot-gold/30 rounded-2xl flex justify-center items-center text-tarot-gold/50 text-xl m-[10px]">
            {/* Simple placeholder */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Spread;
