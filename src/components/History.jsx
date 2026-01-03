import React, { useState, useEffect } from 'react';
import Interpretation from './Interpretation';
import Card from './Card';

const History = ({ language, t }) => {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('tarot_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).reverse()); // Show newest first
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
        <div className="text-4xl mb-4 text-tarot-gold opacity-50">📜</div>
        <p className="text-gray-400 font-serif">{t('noHistory')}</p>
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
                    <div key={c.id} className="w-8 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center overflow-hidden">
                      {/* Just a color block or tiny text */}
                      <div className="w-full h-full" style={{ backgroundColor: c.image_placeholder_color || '#333' }}></div>
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
