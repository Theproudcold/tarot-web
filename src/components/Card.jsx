import React from 'react';

const Card = ({ card, isFlipped, onClick, style, language = 'en' }) => {
  // Helper to safely get localized string or fallback
  const getLocalized = (obj, lang) => {
    if (typeof obj === 'string') return obj; // Handle legacy string data
    return obj[lang] || obj['en'] || '';
  };

  // Determine suit symbol/color if no image
  const getSuitTheme = (card) => {
    const name = getLocalized(card.name, 'en').toLowerCase();

    // Determine Suit
    let suit = 'major';
    if (name.includes('wands') || name.includes('权杖')) suit = 'wands';
    else if (name.includes('cups') || name.includes('圣杯')) suit = 'cups';
    else if (name.includes('swords') || name.includes('宝剑')) suit = 'swords';
    else if (name.includes('pentacles') || name.includes('星币')) suit = 'pentacles';

    // Theme Colors & Assets
    // We keep colors for Court borders or text accents, but use images for symbols
    const themes = {
      wands: {
        asset: '/src/assets/suits/wand.png',
        color: 'text-red-900',
        border: 'border-red-900/50',
        symbol: '🔥' // Fallback
      },
      cups: {
        asset: '/src/assets/suits/cup.png',
        color: 'text-blue-900',
        border: 'border-blue-900/50',
        symbol: '🏆'
      },
      swords: {
        asset: '/src/assets/suits/sword.png',
        color: 'text-slate-800',
        border: 'border-slate-800/50',
        symbol: '⚔️'
      },
      pentacles: {
        asset: '/src/assets/suits/pentacle.png',
        color: 'text-emerald-900',
        border: 'border-emerald-900/50',
        symbol: '🪙'
      },
      major: {
        asset: null,
        color: 'text-tarot-gold',
        border: 'border-tarot-gold',
        symbol: '✨'
      }
    };

    const theme = themes[suit];

    // Determine Rank
    let rank = 0;
    if (suit !== 'major') {
      const n = name.split(' ')[0].toLowerCase(); // "Ace" of Wands
      const ranks = { ace: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, page: 11, knight: 12, queen: 13, king: 14 };
      rank = ranks[n] || 0;
    }

    return { ...theme, rank, suit };
  };

  const theme = card ? getSuitTheme(card) : {};

  // Render Pips based on count
  const renderPips = (count, asset, symbol) => {
    // Create a grid layout based on count
    const pips = Array.from({ length: count });

    return (
      <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
        {/* Ace: Huge Central Icon */}
        {count === 1 && (
          <img
            src={asset}
            alt="Ace"
            className="w-[80%] drop-shadow-2xl brightness-110 filter sepia-[.2]"
          />
        )}

        {/* 2-10: Grid */}
        {count > 1 && count <= 10 && (
          <div className={`grid ${count > 3 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 w-full h-full justify-items-center content-center`}>
            {pips.map((_, i) => (
              <div key={i} className="flex items-center justify-center w-full h-full relative">
                <img
                  src={asset}
                  alt="Pip"
                  className="w-[80%] max-h-[50px] object-contain drop-shadow-md filter sepia-[.2]"
                  style={{ transform: `rotate(${Math.random() * 10 - 5}deg)` }} // Slight random tilt for realism
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Court Card Visual (Enhanced)
  const renderCourt = (rank, asset) => {
    const titles = { 11: 'Page', 12: 'Knight', 13: 'Queen', 14: 'King' };
    // Use different layouts/scales for court cards to differentiate
    // Maybe a large symbol + a crown overlay or specific framing

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
        {/* Decorative Frame */}
        <div className="absolute inset-2 border-[4px] border-double border-black/20 rounded-lg pointer-events-none"></div>

        <div className="w-[120px] h-[120px] rounded-full border-4 border-black/10 flex items-center justify-center bg-black/5 mb-4 shadow-inner">
          <img src={asset} alt="Suit" className="w-[70%] drop-shadow-xl" />
        </div>

        <div className="font-serif text-2xl font-bold opacity-70 uppercase tracking-widest text-black/60">
          {titles[rank]}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-[200px] h-[340px] perspective-1000 cursor-pointer m-[10px] group ${isFlipped ? 'flipped' : ''}`}
      onClick={onClick}
      style={style}
    >
      <div className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>

        {/* Front (Back of Deck Style) */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-tarot-dark card-pattern overflow-hidden">
          <img src="/src/assets/card-back.png" alt="Card Back" className="w-full h-full object-cover opacity-90" />
        </div>

        {/* Back (Face of Card) */}
        <div
          className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-[#fdfbf7] text-gray-800 p-0 rotate-y-180 shadow-inner overflow-hidden"
        >
          {card && (
            <div className="relative w-full h-full flex flex-col">
              {/* Card Main Area */}
              <div className="h-[78%] w-full overflow-hidden relative">
                {/* Parchment Texture Background for ALL cards (underlay) */}
                <div className="absolute inset-0 bg-[url('/src/assets/textures/parchment.png')] bg-cover opacity-100 brightness-95 contrast-125 sepia-[.3]"></div>

                {card.image ? (
                  /* Major Arcana Image */
                  <img src={card.image} alt={getLocalized(card.name, language)} className="w-full h-full object-cover relative z-10 mix-blend-multiply opacity-90" />
                ) : (
                  /* Minor Arcana / Procedural */
                  <div className={`w-full h-full flex flex-col items-center justify-center relative z-10`}>
                    {/* Inner Border */}
                    <div className={`absolute inset-3 border-2 ${theme.border} opacity-40 rounded pointer-events-none`}></div>

                    {theme.rank >= 1 && theme.rank <= 10 ? renderPips(theme.rank, theme.asset, theme.symbol) : null}
                    {theme.rank >= 11 ? renderCourt(theme.rank, theme.asset) : null}

                    {/* Fallback */}
                    {theme.rank === 0 && (
                      <div className="text-6xl animate-pulse-slow">{theme.symbol}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Text Area */}
              <div className="h-[22%] bg-[#1a1a1a] text-[#e0cfa0] flex flex-col justify-center items-center relative z-20 border-t-[4px] border-[#a18c58] shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                <h3 className="mt-0 font-serif font-bold tracking-wider text-sm w-full text-center uppercase drop-shadow-md">
                  {getLocalized(card.name, language)}
                </h3>
                {/* 
                <div className="w-6 h-[1px] bg-[#a18c58]/50 my-1"></div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#a18c58] opacity-80">
                  {getLocalized(card.suite, language)}
                </div>
                */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
