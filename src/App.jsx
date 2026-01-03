import React, { useState, useEffect } from 'react';
import { tarotCards } from './data/tarotCards';
// import Deck from './components/Deck'; // Deprecated for CardSelector
import CardSelector from './components/CardSelector';
import Spread from './components/Spread';
import Gallery from './components/Gallery';
import Interpretation from './components/Interpretation';
import { useTranslation } from './hooks/useTranslation';

import History from './components/History';

function App() {
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [gameState, setGameState] = useState('start'); // start, drawing, complete
  const [viewMode, setViewMode] = useState('reading'); // 'reading', 'gallery', 'history'

  const { t, language, setLanguage, getLocalized } = useTranslation('zh');

  // Fisher-Yates Shuffle
  const shuffleDeck = () => {
    const newDeck = [...tarotCards];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    setDeck(newDeck);
    setDrawnCards([]);
    setGameState('drawing');
  };

  useEffect(() => {
    shuffleDeck();
  }, []);

  const saveToHistory = (cards) => {
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      cards: cards
    };

    const saved = localStorage.getItem('tarot_history');
    let history = saved ? JSON.parse(saved) : [];
    history.push(record);

    // Limit to last 50 readings
    if (history.length > 50) history = history.slice(history.length - 50);

    localStorage.setItem('tarot_history', JSON.stringify(history));
  };

  const handleSelectCard = () => {
    if (drawnCards.length >= 3) return;

    // Pick a card from the "virtual" deck (top of the shuffled array)
    const newDeck = [...deck];
    const card = newDeck.pop();

    if (card) {
      setDeck(newDeck);
      const isReversed = Math.random() < 0.5;
      const drawnCard = { ...card, isReversed };
      const newDrawn = [...drawnCards, drawnCard];
      setDrawnCards(newDrawn);

      if (newDrawn.length === 3) {
        setGameState('complete');
        saveToHistory(newDrawn);
      }
    }
  };

  const handleReset = () => {
    shuffleDeck();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  }

  return (
    <div className="flex flex-col min-h-screen text-center relative overflow-x-hidden">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1 border border-tarot-gold text-tarot-gold rounded hover:bg-tarot-gold hover:text-tarot-bg transition-colors text-sm"
        >
          {language === 'en' ? '中文' : 'English'}
        </button>
      </div>

      <header className="p-4 md:p-8 bg-black/20 border-b border-tarot-gold/20 backdrop-blur-sm">
        <h1 className="font-serif text-3xl md:text-5xl m-0 text-tarot-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
          {t('title')}
        </h1>
        <p className="italic opacity-80 mt-2 text-gray-300 text-sm md:text-base">
          {t('subtitle')}
        </p>

        {/* Navigation */}
        <div className="flex justify-center gap-3 md:gap-6 mt-4 md:mt-6 flex-wrap">
          <button
            onClick={() => setViewMode('reading')}
            className={`text-sm md:text-lg font-serif transition-colors border-b-2 ${viewMode === 'reading' ? 'text-tarot-gold border-tarot-gold' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t('navReading')}
          </button>
          <button
            onClick={() => setViewMode('gallery')}
            className={`text-sm md:text-lg font-serif transition-colors border-b-2 ${viewMode === 'gallery' ? 'text-tarot-gold border-tarot-gold' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t('navGallery')}
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`text-sm md:text-lg font-serif transition-colors border-b-2 ${viewMode === 'history' ? 'text-tarot-gold border-tarot-gold' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t('navHistory')}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-2 md:p-4 gap-1 md:gap-4 w-full max-w-6xl mx-auto">

        {viewMode === 'reading' && (
          <>
            {/* Spread Area */}
            <div className="w-full flex flex-col items-center justify-center flex-1">
              <div className="w-full min-h-[200px] md:min-h-[400px] flex items-center justify-center">
                <Spread cards={drawnCards} language={language} />
              </div>

              {/* Interpretation */}
              {gameState === 'complete' && (
                <Interpretation cards={drawnCards} language={language} t={t} />
              )}
            </div>

            {/* Interaction Area */}
            <div className="w-full flex justify-center items-end min-h-[220px] md:min-h-[300px]">
              {gameState !== 'complete' ? (
                <CardSelector
                  onSelect={handleSelectCard}
                  cardsRemaining={deck.length}
                  language={language}
                  t={t}
                />
              ) : (
                <div className="flex flex-col items-center gap-6 animate-fadeIn pb-10 mt-8">
                  <h2 className="text-2xl text-tarot-gold font-serif">{t('readingComplete')}</h2>
                  <button
                    className="bg-transparent border-2 border-tarot-gold text-tarot-gold px-8 py-3 text-xl rounded-full cursor-pointer transition-all duration-300 uppercase tracking-widest hover:bg-tarot-gold hover:text-tarot-bg hover:shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                    onClick={handleReset}
                  >
                    {t('newReading')}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'gallery' && (
          <Gallery cards={tarotCards} language={language} />
        )}

        {viewMode === 'history' && (
          <History language={language} t={t} />
        )}
      </main>

      <footer className="p-4 bg-black/30 text-xs opacity-50">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}

export default App;
