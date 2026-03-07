import React, { useRef } from 'react';
import { resolveAssetPath } from '../lib/assetPaths.js';

const Card = ({
  card,
  isFlipped,
  onClick,
  style,
  language = 'en',
  className,
  interactive = true,
  floating = true,
}) => {
  const cardRef = useRef(null);

  const getLocalized = (value, lang) => {
    if (typeof value === 'string') return value;
    return value?.[lang] || value?.en || '';
  };

  const handleMouseMove = (event) => {
    if (!interactive || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    cardRef.current.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = '';
    cardRef.current.style.setProperty('--glare-x', '50%');
    cardRef.current.style.setProperty('--glare-y', '50%');
  };

  const handleKeyDown = (event) => {
    if (!onClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  const animationDelay = `${-((Number(card?.id) || 0) % 5)}s`;
  const faceImage = resolveAssetPath(card?.image) || resolveAssetPath('/card-back.png');
  const backImage = resolveAssetPath('/card-back.png');
  const parchmentImage = resolveAssetPath('/textures/parchment.png');
  const cardTitle = getLocalized(card?.name, language);

  return (
    <div
      ref={cardRef}
      className={[
        'relative perspective-1000 group',
        onClick ? 'cursor-pointer' : 'cursor-default',
        floating ? 'animate-float' : '',
        className || 'w-[200px] h-[340px] m-[10px]',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ ...style, animationDelay }}
    >
      <div className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-tarot-dark card-pattern overflow-hidden">
          <img src={backImage} alt="Card Back" decoding="async" className="w-full h-full object-cover opacity-90" />
        </div>

        <div className="absolute w-full h-full backface-hidden rounded-2xl flex flex-col justify-center items-center border-[6px] border-[#2c2c2c] bg-[#fdfbf7] text-gray-800 p-0 rotate-y-180 shadow-inner overflow-hidden">
          {card && (
            <div className="relative w-full h-full flex flex-col">
              <div className="h-[78%] w-full overflow-hidden relative">
                <div
                  className="absolute inset-0 bg-cover opacity-100 brightness-95 contrast-110 sepia-[.2] z-0"
                  style={{ backgroundImage: `url(${parchmentImage})` }}
                />

                <div className="absolute inset-1.5 border-[3px] border-double border-tarot-gold/60 rounded-sm z-20 pointer-events-none" />
                <div className="absolute inset-1 border border-tarot-gold/30 rounded z-20 pointer-events-none" />

                <div
                  className="relative w-full h-full z-10 flex items-center justify-center transition-transform duration-500"
                  style={{ transform: card.isReversed ? 'rotate(180deg)' : 'none' }}
                >
                  <img
                    src={faceImage}
                    alt={cardTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-[94%] h-[94%] object-cover mix-blend-multiply opacity-95 shadow-inner rounded-sm filter contrast-110 sepia-[.1]"
                  />
                </div>

                <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-black/40 z-30 pointer-events-none" />
                <div className="absolute inset-0 holo-sheen z-40 opacity-0 group-hover:opacity-60 mix-blend-overlay pointer-events-none transition-opacity duration-500" />
              </div>

              <div className="h-[22%] bg-[#1a1a1a] text-[#e0cfa0] flex flex-col justify-center items-center relative z-20 border-t-[4px] border-[#a18c58] shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                <h3 className="mt-0 w-full px-2 text-center font-serif text-sm font-bold uppercase tracking-wider drop-shadow-md">
                  {cardTitle}
                  {card.isReversed && (
                    <span className="mt-0.5 block text-[10px] text-red-300 opacity-80">
                      {language === 'zh' ? '(逆位)' : '(Reversed)'}
                    </span>
                  )}
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Card);
