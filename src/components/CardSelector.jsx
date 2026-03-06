import React, { useEffect, useRef, useState } from 'react';
import { resolveAssetPath } from '../lib/assetPaths.js';
import { motion } from 'framer-motion';

const MotionButton = motion.button;

const CardSelector = ({ onSelect, cardsRemaining, t }) => {
  const resolvePath = resolveAssetPath;
  const pickTimeoutRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => () => {
    if (pickTimeoutRef.current) {
      window.clearTimeout(pickTimeoutRef.current);
    }
  }, []);

  const handlePick = (index) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(index);
    setHoverIndex(index);

    pickTimeoutRef.current = window.setTimeout(() => {
      onSelect();
      setSelectedIndex(null);
      setHoverIndex(null);
      pickTimeoutRef.current = null;
    }, isMobile ? 220 : 280);
  };

  const maxCards = isMobile ? 9 : 17;
  const visualCount = Math.min(cardsRemaining, maxCards);
  const cards = Array.from({ length: visualCount }, (_, index) => index);
  const totalAngle = isMobile ? 66 : 88;
  const angleStep = totalAngle / (visualCount - 1 || 1);
  const startAngle = -totalAngle / 2;
  const radius = isMobile ? 250 : 420;

  return (
    <div className="w-full overflow-visible transition-all duration-300">
      <div className="flex flex-col items-center gap-2 pb-6 md:pb-8">
        <h3 className="text-center font-serif text-sm uppercase tracking-[0.28em] text-tarot-gold md:text-base">
          {t('selectCardPrompt')}
        </h3>
        <p className="max-w-xl px-6 text-center text-xs text-gray-400 md:text-sm">
          {t('selectCardHint')}
        </p>
      </div>

      <div className="relative flex min-h-[220px] w-full items-end justify-center overflow-visible px-4 md:min-h-[300px]">
        <div className="pointer-events-none absolute bottom-4 left-1/2 h-24 w-[72%] -translate-x-1/2 rounded-full bg-tarot-gold/10 blur-3xl md:bottom-8 md:h-28"></div>

        {cards.map((index) => {
          const rotation = startAngle + index * angleStep;
          const isHovered = hoverIndex === index;
          const isSelected = selectedIndex === index;
          const isDimmed = selectedIndex !== null && !isSelected;

          return (
            <MotionButton
              key={index}
              type="button"
              className="absolute bottom-0 left-1/2 h-[136px] w-[80px] origin-bottom cursor-pointer border-0 bg-transparent p-0 md:h-[206px] md:w-[118px]"
              style={{
                marginLeft: isMobile ? '-40px' : '-59px',
                transformOrigin: `50% ${radius}px`,
                pointerEvents: selectedIndex !== null && !isSelected ? 'none' : 'auto',
              }}
              initial={{ rotate: 0, y: 180, opacity: 0 }}
              animate={{
                rotate: isSelected ? rotation * 0.25 : rotation,
                y: isSelected ? (isMobile ? -88 : -130) : isHovered ? (isMobile ? -18 : -30) : 0,
                scale: isSelected ? 1.12 : isHovered ? 1.04 : 1,
                zIndex: isSelected ? 200 : isHovered ? 100 : index,
                opacity: isDimmed ? 0.18 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: isSelected ? 220 : 160,
                damping: isSelected ? 18 : 24,
                mass: 0.8,
                delay: selectedIndex === null ? index * 0.01 : 0,
              }}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
              onClick={() => handlePick(index)}
              whileTap={selectedIndex === null ? { scale: 0.97 } : undefined}
              aria-label={t('selectCardPrompt')}
            >
              <div className={`relative h-full w-full overflow-hidden rounded-xl border-2 bg-tarot-dark shadow-[0_16px_35px_rgba(0,0,0,0.45)] transition-all duration-200 ${isSelected ? 'border-tarot-gold shadow-[0_0_35px_rgba(212,175,55,0.45)] brightness-110' : 'border-tarot-gold/60 brightness-90 hover:brightness-110'}`}>
                <img src={resolvePath('/card-back.png')} alt="Card Back" decoding="async" className="h-full w-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-70'}`}></div>
                <div className={`absolute inset-x-3 top-3 h-px bg-tarot-gold/40 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}></div>
              </div>
            </MotionButton>
          );
        })}
      </div>
    </div>
  );
};

export default CardSelector;
