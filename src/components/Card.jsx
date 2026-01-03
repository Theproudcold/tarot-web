import React, { useRef } from 'react';

const Card = ({ card, isFlipped, onClick, style, language = 'en' }) => {
  const cardRef = useRef(null);

  // Helper to safely get localized string or fallback
  const getLocalized = (obj, lang) => {
    if (typeof obj === 'string') return obj; // Handle legacy string data
    return obj[lang] || obj['en'] || '';
  };

  // Interactive 3D Tilt Logic
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max tilt 15 degrees
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    // Apply transform (overrides CSS float animation)
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;

    // Update glare position variables
    cardRef.current.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    // Clear inline transform to let CSS animation take over
    cardRef.current.style.transform = '';
    cardRef.current.style.setProperty('--glare-x', '50%');
    cardRef.current.style.setProperty('--glare-y', '50%');
  };

  // Helper to resolve paths with base URL for GitHub Pages
  const resolvePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const base = import.meta.env.BASE_URL;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${cleanPath}`;
  };

  // Determine suit symbol/color if no image
  const getSuitTheme = (card) => {
    const name = getLocalized(card.name, 'en').toLowerCase();

    // Determine Suit
    let suit = 'major';
    if (name.includes('wands') || name.includes('wand') || name.includes('权杖')) suit = 'wands';
    else if (name.includes('cups') || name.includes('cup') || name.includes('圣杯')) suit = 'cups';
    else if (name.includes('swords') || name.includes('sword') || name.includes('宝剑')) suit = 'swords';
    else if (name.includes('pentacles') || name.includes('pentacle') || name.includes('coins') || name.includes('星币')) suit = 'pentacles';

    // Theme Colors & Assets
    const themes = {
      wands: {
        asset: resolvePath('/suits/wand.png'),
        color: 'text-red-900',
        border: 'border-red-900/50',
        symbol: '🔥'
      },
      cups: {
        asset: resolvePath('/suits/cup.png'),
        color: 'text-blue-900',
        border: 'border-blue-900/50',
        symbol: '🏆'
      },
      swords: {
        asset: resolvePath('/suits/sword.png'),
        color: 'text-slate-800',
        border: 'border-slate-800/50',
        symbol: '⚔️'
      },
      pentacles: {
        asset: resolvePath('/suits/pentacle.png'),
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
      ref={cardRef}
      className={`relative w-[200px] h-[340px] perspective-1000 cursor-pointer m-[10px] group ${isFlipped ? 'flipped' : ''} animate-float`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, animationDelay: `${Math.random() * -5}s` }}
    >
      <div className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>

        {/* Front (Back of Deck Style) */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-tarot-dark card-pattern overflow-hidden">
          <img src={resolvePath('/card-back.png')} alt="Card Back" className="w-full h-full object-cover opacity-90" />
        </div>

        {/* Back (Face of Card) */}
        <div
          className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-[#fdfbf7] text-gray-800 p-0 rotate-y-180 shadow-inner overflow-hidden"
        >
          {card && (
            <div className="relative w-full h-full flex flex-col">
              {/* Card Main Area */}
              <div className="h-[78%] w-full overflow-hidden relative">
                {/* 1. Base Paper Texture (Unified for ALL cards) */}
                <div
                  className="absolute inset-0 bg-cover opacity-100 brightness-95 contrast-110 sepia-[.2] z-0"
                  style={{ backgroundImage: `url(${resolvePath('/textures/parchment.png')})` }}
                ></div>

                {/* 2. Unified Gold Frame Border (Procedural) */}
                <div className="absolute inset-1.5 border-[3px] border-double border-tarot-gold/60 rounded-sm z-20 pointer-events-none"></div>
                <div className="absolute inset-1 border border-tarot-gold/30 rounded z-20 pointer-events-none"></div>

                {/* 3. Content Layer */}
                <div
                  className="relative w-full h-full z-10 flex items-center justify-center transition-transform duration-500"
                  style={{ transform: card.isReversed ? 'rotate(180deg)' : 'none' }}
                >
                  {/* Render RWS Image for ALL cards */}
                  <img
                    src={resolvePath(card?.image) || resolvePath('/card-back.png')}
                    alt={getLocalized(card?.name, language)}
                    className="w-[94%] h-[94%] object-cover mix-blend-multiply opacity-95 shadow-inner rounded-sm filter contrast-110 sepia-[.1]"
                  />
                </div>

                {/* 4. Vignette Overlay (Top) */}
                <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-black/40 z-30 pointer-events-none"></div>

                {/* 5. Holographic Sheen Overlay (Passive -> Active on Hover) */}
                <div className="absolute inset-0 holo-sheen z-40 opacity-0 group-hover:opacity-60 mix-blend-overlay pointer-events-none transition-opacity duration-500"></div>


              </div>

              {/* Footer Text Area */}
              <div className="h-[22%] bg-[#1a1a1a] text-[#e0cfa0] flex flex-col justify-center items-center relative z-20 border-t-[4px] border-[#a18c58] shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                <h3 className="mt-0 font-serif font-bold tracking-wider text-sm w-full text-center uppercase drop-shadow-md">
                  {getLocalized(card.name, language)}
                  {card.isReversed && (
                    <span className="block text-[10px] text-red-300 opacity-80 mt-0.5">
                      {language === 'zh' ? '(逆位)' : '(Reversed)'}
                    </span>
                  )}
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
