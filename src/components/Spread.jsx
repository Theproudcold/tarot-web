import React from 'react';
import Card from './Card';

const headings = {
  en: ['Past', 'Present', 'Future'],
  zh: ['过去', '现在', '未来'],
};

const emptyMessages = {
  en: 'Draw above to reveal the spread',
  zh: '先在上方抽牌，牌阵会落在这里',
};

const Spread = ({ cards, language = 'en' }) => {
  const hasCards = cards.length > 0;
  const emptyMessage = emptyMessages[language] || emptyMessages.en;
  const placeholderClassName = hasCards
    ? 'w-[200px] h-[340px] m-[10px]'
    : 'w-[118px] h-[180px] md:w-[152px] md:h-[230px]';

  return (
    <div className={`flex w-full items-center justify-center gap-4 transition-all duration-300 md:gap-8 ${hasCards ? 'min-h-[220px] md:min-h-[400px] flex-col md:flex-row' : 'min-h-[160px] md:min-h-[240px] flex-row'}`}>
      {cards.map((card, index) => (
        <div key={`${card.id}-${index}`} className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: `${index * 0.2}s` }}>
          <h4 className="mb-2 font-serif text-xl tracking-wide text-tarot-gold">{headings[language][index]}</h4>
          <Card
            card={card}
            isFlipped={true}
            language={language}
          />
        </div>
      ))}
      {[...Array(3 - cards.length)].map((_, index) => {
        const headingIndex = cards.length + index;
        const showEmptyMessage = !hasCards && headingIndex === 1;

        return (
          <div key={`empty-${headingIndex}`} className="flex flex-col items-center justify-center opacity-40">
            <h4 className="mb-2 font-serif text-sm tracking-wide text-tarot-gold/60 md:text-xl">{headings[language][headingIndex]}</h4>
            <div className={`${placeholderClassName} flex items-center justify-center rounded-2xl border-2 border-dashed border-tarot-gold/30 px-4 text-center text-tarot-gold/60`}>
              {showEmptyMessage ? (
                <span className="text-xs leading-relaxed md:text-sm">{emptyMessage}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Spread;
