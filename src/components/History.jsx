import React, { useState, useEffect } from 'react';
import { tarotCards } from '../data/tarotCards';
import Interpretation from './Interpretation';
import Card from './Card';

const History = ({ language, t }) => {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('tarot_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-hydrate cards from current tarotCards data to ensure new image paths are used
        // This fixes the issue where old history has stale 'image: null' or old paths
        const hydrated = parsed.map(record => ({
          ...record,
          cards: record.cards.map(c => {
            const freshCard = tarotCards.find(tc => tc.id === c.id);
            return freshCard ? freshCard : c;
          })
        }));
        setHistory(hydrated.reverse());
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('tarot_history');
    setHistory([]);
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (language === 'zh') {
      return date.toLocaleString('zh-CN', { hour12: false });
    }
    return date.toLocaleString('en-US');
  };

  if (history.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-10 min-h-[400px]">
        <div className="text-6xl mb-6 text-tarot-gold opacity-60 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          {/* Crystal Ball Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-tarot-gold/60 font-serif text-xl tracking-wider">{t('noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl text-tarot-gold font-serif">{t('historyTitle')}</h2>
        <button
          onClick={clearHistory}
          className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-2 py-1 rounded transition-colors"
        >
          {t('deleteHistory')}
        </button>
      </div>

      <div className="space-y-6">
        {history.map((record) => (
          <div key={record.id} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/10">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            >
              <div className="flex flex-col text-left">
                <span className="text-tarot-gold text-sm font-bold">
                  {t('historyDatePrefix')} {formatDate(record.timestamp)}
                </span>
                <div className="flex gap-2 mt-2">
                  {/* Mini card previews */}
                  {record.cards.map(c => (
                    <div key={c.id} className="w-10 h-16 rounded border border-gray-600 flex items-center justify-center overflow-hidden relative bg-black">
                      <div className="transform scale-[0.2] origin-top-left w-[200px] h-[340px] pointer-events-none">
                        <Card
                          card={c}
                          isFlipped={true}
                          language={language}
                          style={{ width: '100%', height: '100%', margin: 0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-tarot-gold text-2xl transform transition-transform duration-300" style={{ transform: expandedId === record.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </div>
            </div>

            {expandedId === record.id && (
              <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                {/* Re-use Interpretation Comp for the details */}
                <div className="flex justify-center gap-4 mb-6">
                  {record.cards.map(card => (
                    <Card
                      key={card.id}
                      card={card}
                      isFlipped={true}
                      language={language}
                      style={{ width: '100px', height: '170px' }} // Small scale
                    />
                  ))}
                </div>
                <Interpretation cards={record.cards} language={language} t={t} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
