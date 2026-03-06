import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tarotCards } from './data/tarotCards';
import CardSelector from './components/CardSelector';
import Spread from './components/Spread';
import Gallery from './components/Gallery';
import Interpretation from './components/Interpretation';
import RuntimeStatusBar from './components/RuntimeStatusBar';
import AiSettingsPanel from './components/AiSettingsPanel';
import { useTranslation } from './hooks/useTranslation';
import History from './components/History';
import { requestReadingStream } from './lib/readingApi.js';
import { createHistoryRecord, upsertHistoryRecord } from './lib/historyStorage';
import { loadAiSettings, saveAiSettings } from './lib/aiSettings';
import { mergeReadingWithBase } from './lib/readingContract.js';

const phaseStageOrder = ['draft', 'review', 'finalize', 'fallback'];

const createInitialPhases = (orchestration) => (
  orchestration === 'multi'
    ? sortPhases([
      { stage: 'draft', status: 'pending' },
      { stage: 'review', status: 'pending' },
      { stage: 'finalize', status: 'pending' },
    ])
    : []
);

const createShuffledDeck = () => {
  const nextDeck = [...tarotCards];
  for (let index = nextDeck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextDeck[index], nextDeck[randomIndex]] = [nextDeck[randomIndex], nextDeck[index]];
  }
  return nextDeck;
};

const sortPhases = (phases = []) => [...phases].sort((left, right) => {
  const leftIndex = phaseStageOrder.indexOf(left.stage);
  const rightIndex = phaseStageOrder.indexOf(right.stage);
  return (leftIndex === -1 ? phaseStageOrder.length : leftIndex) - (rightIndex === -1 ? phaseStageOrder.length : rightIndex);
});

const upsertPhase = (phases, nextPhase) => {
  if (!nextPhase?.stage) {
    return phases;
  }

  const existingIndex = phases.findIndex((item) => item.stage === nextPhase.stage);
  const merged = existingIndex >= 0
    ? phases.map((item, index) => (index === existingIndex ? { ...item, ...nextPhase } : item))
    : [...phases, nextPhase];

  return sortPhases(merged);
};

const applyCustomProviderLabel = (reading, settings) => {
  if (!reading) return reading;

  const providerLabel = typeof settings?.providerLabel === 'string' ? settings.providerLabel.trim() : '';
  if (!providerLabel || (reading.source !== 'openai' && reading.source !== 'custom-openai')) {
    return reading;
  }

  return {
    ...reading,
    providerLabel,
  };
};

function App() {
  const [deck, setDeck] = useState(() => createShuffledDeck());
  const [drawnCards, setDrawnCards] = useState([]);
  const [gameState, setGameState] = useState('drawing');
  const [viewMode, setViewMode] = useState('reading');
  const [readingQuestion, setReadingQuestion] = useState('');
  const [readingResult, setReadingResult] = useState(null);
  const [readingStatus, setReadingStatus] = useState('idle');
  const [readingPhases, setReadingPhases] = useState([]);
  const [readingOrchestration, setReadingOrchestration] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);
  const [aiSettings, setAiSettings] = useState(() => loadAiSettings());
  const requestCounterRef = useRef(0);

  const { t, language, setLanguage } = useTranslation('zh');

  useEffect(() => {
    saveAiSettings(aiSettings);
  }, [aiSettings]);

  const shuffleDeck = useCallback(() => {
    requestCounterRef.current += 1;
    setDeck(createShuffledDeck());
    setDrawnCards([]);
    setGameState('drawing');
    setReadingQuestion('');
    setReadingResult(null);
    setReadingStatus('idle');
    setReadingPhases([]);
    setReadingOrchestration(null);
    setActiveRecord(null);
  }, []);

  const generateReading = useCallback(async (cards, recordMeta, nextLanguage = language) => {
    if (!cards || cards.length < 3) return;

    const requestId = ++requestCounterRef.current;
    const nextRecord = recordMeta || activeRecord || {
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };

    setActiveRecord(nextRecord);
    setReadingResult(null);
    setReadingStatus('loading');
    setReadingPhases([]);
    setReadingOrchestration(null);

    const { reading } = await requestReadingStream({
      cards,
      language: nextLanguage,
      question: readingQuestion.trim(),
      aiConfig: aiSettings,
      onMeta: (meta) => {
        if (requestId !== requestCounterRef.current) return;
        const nextOrchestration = meta?.orchestration || null;
        setReadingOrchestration(nextOrchestration);
        setReadingPhases((current) => (current.length > 0 || nextOrchestration !== 'multi' ? current : createInitialPhases(nextOrchestration)));
      },
      onPhase: (phase) => {
        if (requestId !== requestCounterRef.current) return;
        setReadingPhases((current) => upsertPhase(current, phase));
      },
      onPartial: (partialReading, meta = {}) => {
        if (requestId !== requestCounterRef.current) return;
        setReadingResult((current) => {
          const nextReading = meta.stage === 'finalize' && current
            ? mergeReadingWithBase(current, partialReading, {
              language: partialReading.language,
              source: partialReading.source,
              model: partialReading.model,
              question: partialReading.question,
              createdAt: partialReading.createdAt,
            })
            : partialReading;

          return applyCustomProviderLabel(nextReading, aiSettings);
        });
      },
    });

    if (requestId !== requestCounterRef.current) return;

    const finalReading = applyCustomProviderLabel(reading, aiSettings);
    setReadingResult(finalReading);
    setReadingStatus('success');
    setReadingOrchestration(finalReading?.orchestration || null);
    setReadingPhases((current) => {
      if (!Array.isArray(finalReading?.agentPipeline)) {
        return current;
      }

      const completedPhases = sortPhases(
        finalReading.agentPipeline.map((stage) => ({
          stage,
          status: 'completed',
        }))
      );

      const fallbackPhase = current.find((phase) => phase.stage === 'fallback');
      return fallbackPhase ? sortPhases([...completedPhases, fallbackPhase]) : completedPhases;
    });

    upsertHistoryRecord(createHistoryRecord({
      id: nextRecord.id,
      timestamp: nextRecord.timestamp,
      cards,
      question: readingQuestion.trim(),
      language: nextLanguage,
      reading: finalReading,
    }));
  }, [activeRecord, aiSettings, language, readingQuestion]);

  const handleSelectCard = () => {
    if (drawnCards.length >= 3) return;

    const nextDeck = [...deck];
    const card = nextDeck.pop();

    if (!card) return;

    setDeck(nextDeck);

    const drawnCard = {
      ...card,
      isReversed: Math.random() < 0.5,
    };
    const nextDrawnCards = [...drawnCards, drawnCard];
    setDrawnCards(nextDrawnCards);

    if (nextDrawnCards.length === 3) {
      const nextRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };

      setGameState('complete');
      void generateReading(nextDrawnCards, nextRecord);
    }
  };

  const handleReset = () => {
    shuffleDeck();
  };

  const handleRefreshReading = () => {
    if (drawnCards.length < 3) return;
    void generateReading(drawnCards, activeRecord);
  };

  const isReadingComplete = gameState === 'complete';
  const progressLabel = `${Math.min(drawnCards.length, 3)}/3 ${t('cardsRemaining')}`;

  const readingSidebar = (
    <aside className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-3xl border border-white/10 bg-black/30 p-4 text-left backdrop-blur-sm md:p-5">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="reading-question" className="block text-lg font-serif text-tarot-gold md:text-xl">
              {t('aiQuestionLabel')}
            </label>
            {isReadingComplete && (
              <button
                onClick={handleRefreshReading}
                className="self-start rounded border border-tarot-gold px-4 py-2 text-tarot-gold transition-colors hover:bg-tarot-gold hover:text-tarot-bg md:self-auto"
              >
                {readingStatus === 'loading'
                  ? t('aiRefreshing')
                  : readingResult
                    ? t('aiRegenerate')
                    : t('aiGenerate')}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 md:text-sm">{t('aiQuestionHint')}</p>
        </div>
        <textarea
          id="reading-question"
          value={readingQuestion}
          onChange={(event) => setReadingQuestion(event.target.value)}
          placeholder={t('aiQuestionPlaceholder')}
          rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-tarot-gold/40"
        />
      </section>

      <AiSettingsPanel
        settings={aiSettings}
        onChange={setAiSettings}
        orchestration={readingOrchestration || readingResult?.orchestration || null}
        language={language}
        t={t}
      />
    </aside>
  );

  return (
    <div className="min-h-screen bg-tarot-bg bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_40%),linear-gradient(180deg,_rgba(10,10,18,0.98),_rgba(5,5,10,1))] text-center text-white overflow-x-hidden">
      <RuntimeStatusBar
        reading={readingResult}
        orchestration={readingOrchestration}
        selectedOrchestration={aiSettings.orchestrationMode || null}
        settings={aiSettings}
        language={language}
        t={t}
      />

      <header className="border-b border-tarot-gold/20 bg-black/20 p-4 backdrop-blur-sm md:p-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <h1 className="m-0 font-serif text-3xl text-tarot-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm italic text-gray-300 opacity-80 md:text-base">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            <button
              onClick={() => setViewMode('reading')}
              className={`border-b-2 text-sm font-serif transition-colors md:text-lg ${viewMode === 'reading' ? 'border-tarot-gold text-tarot-gold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t('navReading')}
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`border-b-2 text-sm font-serif transition-colors md:text-lg ${viewMode === 'gallery' ? 'border-tarot-gold text-tarot-gold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t('navGallery')}
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`border-b-2 text-sm font-serif transition-colors md:text-lg ${viewMode === 'history' ? 'border-tarot-gold text-tarot-gold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t('navHistory')}
            </button>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`rounded-full px-3 py-1 text-xs transition-colors md:text-sm ${language === 'zh' ? 'bg-tarot-gold text-tarot-bg' : 'text-gray-300 hover:text-white'}`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-3 py-1 text-xs transition-colors md:text-sm ${language === 'en' ? 'bg-tarot-gold text-tarot-bg' : 'text-gray-300 hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 md:px-4 md:py-5">
        {viewMode === 'reading' && (
          <div className="grid w-full items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
            <div className="order-2 min-w-0 space-y-4 md:space-y-6 xl:order-1">
              <section className="overflow-visible rounded-3xl border border-tarot-gold/20 bg-black/30 p-4 text-left backdrop-blur-sm md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-tarot-gold/60">{t('drawStepLabel')}</p>
                      <h2 className="mt-2 font-serif text-2xl text-tarot-gold md:text-3xl">
                        {isReadingComplete ? t('drawCompleteTitle') : t('drawDeckTitle')}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
                        {isReadingComplete ? t('drawCompleteHint') : t('drawDeckHint')}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-tarot-gold">
                        {progressLabel}
                      </span>
                      {!isReadingComplete && (
                        <span className="text-xs text-gray-400">{t('drawDeckSubhint')}</span>
                      )}
                    </div>
                  </div>

                  {!isReadingComplete ? (
                    <CardSelector
                      onSelect={handleSelectCard}
                      cardsRemaining={deck.length}
                      t={t}
                    />
                  ) : (
                    <div className="mt-2 flex animate-fadeIn flex-col items-center gap-4 rounded-3xl border border-tarot-gold/10 bg-black/20 py-8 text-center md:py-10">
                      <h3 className="font-serif text-2xl text-tarot-gold">{t('readingComplete')}</h3>
                      <button
                        className="rounded-full border-2 border-tarot-gold bg-transparent px-8 py-3 text-lg uppercase tracking-widest text-tarot-gold transition-all duration-300 hover:bg-tarot-gold hover:text-tarot-bg hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] md:text-xl"
                        onClick={handleReset}
                      >
                        {t('newReading')}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="w-full rounded-3xl border border-white/10 bg-black/25 p-4 text-left backdrop-blur-sm md:p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-tarot-gold md:text-2xl">{t('spreadSectionTitle')}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {isReadingComplete ? t('spreadSectionHintComplete') : t('spreadSectionHintDrawing')}
                    </p>
                  </div>
                  {drawnCards.length > 0 && !isReadingComplete && (
                    <button
                      onClick={handleReset}
                      className="self-start rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-tarot-gold/40 hover:text-tarot-gold md:self-auto"
                    >
                      {t('restartDrawing')}
                    </button>
                  )}
                </div>

                <Spread cards={drawnCards} language={language} />
              </section>

              {isReadingComplete && (
                <Interpretation
                  cards={drawnCards}
                  language={language}
                  reading={readingResult}
                  loading={readingStatus === 'loading'}
                  phases={readingPhases}
                  orchestration={readingOrchestration}
                  selectedOrchestration={aiSettings.orchestrationMode || null}
                  onRetry={handleRefreshReading}
                  t={t}
                />
              )}
            </div>

            {readingSidebar}
          </div>
        )}

        {viewMode === 'gallery' && (
          <Gallery cards={tarotCards} language={language} />
        )}

        {viewMode === 'history' && (
          <History language={language} t={t} />
        )}
      </main>

      <footer className="bg-black/30 p-4 text-xs opacity-50">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}

export default App;
