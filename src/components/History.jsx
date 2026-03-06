import React, { useEffect, useState } from 'react';
import Interpretation from './Interpretation';
import Card from './Card';
import HistoryCardThumbnail from './HistoryCardThumbnail';
import { clearHistoryRecords, loadHistoryRecords } from '../lib/historyStorage';
import { getReadingSourceLabel } from '../lib/readingSource.js';
import { getLocalized, getOrientationLabel, readingSlots } from '../lib/tarotReading.js';

const History = ({ language, t }) => {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setHistory(loadHistoryRecords(language));
  }, [language]);

  const clearHistory = () => {
    clearHistoryRecords();
    setHistory([]);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (language === 'zh') {
      return date.toLocaleString('zh-CN', { hour12: false });
    }
    return date.toLocaleString('en-US');
  };

  if (history.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-10">
        <div className="mb-6 text-6xl text-tarot-gold opacity-60 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-serif text-xl tracking-wider text-tarot-gold/60">{t('noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 animate-fadeIn">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-3xl font-serif text-tarot-gold">{t('historyTitle')}</h2>
        <button
          onClick={clearHistory}
          className="rounded border border-red-900 px-2 py-1 text-xs text-red-400 transition-colors hover:text-red-300"
        >
          {t('deleteHistory')}
        </button>
      </div>

      <div className="space-y-5">
        {history.map((record) => {
          const sourceLabel = getReadingSourceLabel(record.reading?.source || 'local-fallback', language, record.reading?.providerLabel || '');
          const isExpanded = expandedId === record.id;

          return (
            <div
              key={record.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:border-tarot-gold/20 hover:bg-white/[0.07] md:p-5"
            >
              <div
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-3 py-1 text-xs font-semibold text-tarot-gold">
                        {t('historyDatePrefix')} {formatDate(record.timestamp)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                        {t('sourcePrefix')} {sourceLabel}
                      </span>
                    </div>

                    {record.question && (
                      <p className="mt-3 break-words text-sm leading-6 text-gray-200">
                        {t('questionPrefix')} {record.question}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.cards.map((card, index) => {
                        const slotKey = readingSlots[index] || null;
                        const slotLabel = slotKey ? t(slotKey) : `${index + 1}`;
                        const title = getLocalized(card.name, language);
                        const orientationLabel = getOrientationLabel(card, language);

                        return (
                          <span
                            key={`${record.id}-${card.id}-${index}`}
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300"
                          >
                            {slotLabel}: {title} · {orientationLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <div className="flex gap-2 sm:gap-3">
                      {record.cards.map((card, index) => (
                        <HistoryCardThumbnail
                          key={`${record.id}-thumb-${card.id}-${index}`}
                          card={card}
                          index={index}
                          language={language}
                          t={t}
                        />
                      ))}
                    </div>
                    <div
                      className="shrink-0 text-2xl text-tarot-gold transition-transform duration-300"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 animate-fadeIn border-t border-white/10 pt-6">
                  <div className="mb-6 flex flex-wrap justify-center gap-4">
                    {record.cards.map((card, index) => (
                      <div key={`${record.id}-full-${card.id}-${index}`} className="flex flex-col items-center gap-2">
                        <span className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-3 py-1 text-xs text-tarot-gold">
                          {t(readingSlots[index] || 'past')}
                        </span>
                        <Card
                          card={card}
                          isFlipped={true}
                          language={language}
                          className="m-[5px] h-[136px] w-[80px] md:h-[170px] md:w-[100px]"
                        />
                      </div>
                    ))}
                  </div>
                  <Interpretation cards={record.cards} language={language} reading={record.reading} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
