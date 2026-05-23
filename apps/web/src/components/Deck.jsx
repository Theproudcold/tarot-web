import React from 'react';

const Deck = ({ onDraw, cardsRemaining, disabled }) => {
  return (
    <div className="flex flex-col items-center m-8">
      <div
        className={`relative w-[200px] h-[340px] cursor-pointer transition-transform duration-200 hover:scale-105 ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
        onClick={!disabled ? onDraw : undefined}
      >
        {/* Stack Effect Cards */}
        <div className="absolute w-full h-full rounded-2xl border-2 border-tarot-gold bg-tarot-dark card-pattern shadow-lg -rotate-2 top-0 left-0"></div>
        <div className="absolute w-full h-full rounded-2xl border-2 border-tarot-gold bg-tarot-dark card-pattern shadow-lg rotate-1 top-0 left-0"></div>

        {/* Main Top Card */}
        <div className="absolute w-full h-full rounded-2xl border-2 border-tarot-gold bg-tarot-dark card-pattern shadow-lg flex justify-center items-center -top-[5px] -left-[2px]">
          <span className="text-tarot-gold font-serif text-2xl drop-shadow-md bg-black/50 px-5 py-2 rounded">
            {cardsRemaining > 0 ? "Draw Card" : "Empty"}
          </span>
        </div>
      </div>
      <div className="mt-4 text-gray-400 text-sm">{cardsRemaining} cards remaining</div>
    </div>
  );
};

export default Deck;
