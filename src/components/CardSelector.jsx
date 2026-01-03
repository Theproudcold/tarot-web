import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CardSelector = ({ onSelect, cardsRemaining, language, t }) => {
  // We don't want to show ALL 78 cards potentially, maybe just a representation or a subset of "available" cards to pick from.
  // Visual effect: A fan of cards.

  const [hoverIndex, setHoverIndex] = useState(null);

  // Generate a mock array of available cards visually (just indices)
  // Let's show ~22 cards (Major Arcana count) for the visual effect
  const cardCount = Math.min(cardsRemaining, 22);

  // Optimize: Limit the number of visual cards rendered to avoid lag
  // Even if 78 cards remain, we only show ~40 for the visual fan effect
  const VISUAL_MAX = 40;
  const visualCount = Math.min(cardCount, VISUAL_MAX);
  const cards = Array.from({ length: visualCount }, (_, i) => i);

  // Fan calculations
  const totalAngle = 100; // Wider spread
  const angleStep = totalAngle / (visualCount - 1 || 1);
  const startAngle = -totalAngle / 2;
  const radius = 600; // Radius of the virtual circle for the arc

  return (
    <div className="relative w-full h-[350px] flex justify-center items-end pb-4 overflow-visible">
      <div className="relative w-full h-full flex justify-center items-end">
        <h3 className="absolute top-0 text-tarot-gold/50 text-sm animate-pulse tracking-widest font-serif pointer-events-none">
          {t('selectCardPrompt')}
        </h3>

        {cards.map((i) => {
          const rotation = startAngle + i * angleStep;
          const isHovered = hoverIndex === i;

          // Calculate curve position
          // We want items to fan out from a center point below the screen
          // Use simple geometric approximation or CSS transform origin

          return (
            <motion.div
              key={i}
              className="absolute bottom-[-100px] left-[50%] w-[120px] h-[200px] origin-bottom-center cursor-pointer will-change-transform"
              style={{
                marginLeft: '-60px', // Center the card
                transformOrigin: `50% ${radius}px`, // Rotate around a distant point
              }}
              initial={{ rotate: 0, y: 300, opacity: 0 }}
              animate={{
                rotate: rotation,
                // Push up selected/hovered card slightly, but mainly rely on rotation
                y: isHovered ? -60 : 0,
                // Make the hovered card stand out in z-index and scale
                scale: isHovered ? 1.1 : 1,
                zIndex: isHovered ? 100 : i,
                opacity: 1
              }}
              transition={{
                type: 'spring',
                stiffness: 150, // Reduced stiffness for smoother feel
                damping: 25,
                mass: 0.8,
                delay: i * 0.01 // Faster stagger
              }}
              onHoverStart={() => setHoverIndex(i)}
              onHoverEnd={() => setHoverIndex(null)}
              onClick={onSelect}
              whileTap={{ scale: 0.95 }}
            >
              {/* Card Back Visual */}
              <div className="w-full h-full rounded-xl border-2 border-tarot-gold/50 bg-tarot-dark shadow-xl overflow-hidden brightness-90 hover:brightness-110 transition-all duration-200">
                <img src="/card-back.png" alt="Card Back" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CardSelector;
