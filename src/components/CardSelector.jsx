import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CardSelector = ({ onSelect, cardsRemaining, language, t }) => {
  // We don't want to show ALL 78 cards potentially, maybe just a representation or a subset of "available" cards to pick from.
  // Visual effect: A fan of cards.

  const resolvePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.BASE_URL;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${cleanPath}`;
  };

  const [hoverIndex, setHoverIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate a mock array of available cards visually
  // Adaptive count for mobile
  const maxCards = isMobile ? 12 : 22;
  const cardCount = Math.min(cardsRemaining, maxCards);

  // Optimize: Limit visual cards
  const VISUAL_MAX = 40;
  const visualCount = Math.min(cardCount, VISUAL_MAX);
  const cards = Array.from({ length: visualCount }, (_, i) => i);

  // Fan calculations
  const totalAngle = isMobile ? 80 : 100;
  const angleStep = totalAngle / (visualCount - 1 || 1);
  const startAngle = -totalAngle / 2;
  const radius = isMobile ? 320 : 600; // Tighter radius on mobile

  return (
    <div className="relative w-full h-[220px] md:h-[350px] flex justify-center items-end pb-4 overflow-visible transition-all duration-300">
      <div className="relative w-full h-full flex justify-center items-end">
        <h3 className="absolute top-0 text-tarot-gold/50 text-xs md:text-sm animate-pulse tracking-widest font-serif pointer-events-none">
          {t('selectCardPrompt')}
        </h3>

        {cards.map((i) => {
          const rotation = startAngle + i * angleStep;
          const isHovered = hoverIndex === i;

          return (
            <motion.div
              key={i}
              className="absolute bottom-[-20px] md:bottom-[-100px] left-[50%] w-[80px] h-[134px] md:w-[120px] md:h-[200px] origin-bottom-center cursor-pointer will-change-transform"
              style={{
                marginLeft: isMobile ? '-40px' : '-60px',
                transformOrigin: `50% ${radius}px`,
              }}
              initial={{ rotate: 0, y: 300, opacity: 0 }}
              animate={{
                rotate: rotation,
                y: isHovered ? (isMobile ? -30 : -60) : 0,
                scale: isHovered ? 1.1 : 1,
                zIndex: isHovered ? 100 : i,
                opacity: 1
              }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 25,
                mass: 0.8,
                delay: i * 0.01
              }}
              onHoverStart={() => setHoverIndex(i)}
              onHoverEnd={() => setHoverIndex(null)}
              onClick={onSelect}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full rounded-md md:rounded-xl border-2 border-tarot-gold/50 bg-tarot-dark shadow-xl overflow-hidden brightness-90 hover:brightness-110 transition-all duration-200">
                <img src={resolvePath('/card-back.png')} alt="Card Back" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CardSelector;
