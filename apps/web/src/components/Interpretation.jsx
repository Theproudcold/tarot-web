import React, { useMemo, useState } from 'react';
import { getOrchestrationLabel } from '../lib/orchestrationLabels.js';
import { getReadingSourceLabel } from '../lib/readingSource.js';
import { buildReading } from '../lib/tarotReading';
import { getDisplayedPhases, getTimelineState } from '../lib/readingRuntime.js';

const labelsByLanguage = {
  en: {
    elementalTitle: 'Elemental Energy Analysis',
    dominantTitle: 'Dominant Energy',
    quoteTitle: 'Whispers of the Stars',
    summaryTitle: 'Synthesis',
    cardsTitle: 'Card by Card',
    adviceTitle: 'Actionable Guidance',
    mantraTitle: 'Anchor Phrase',
    followUpsTitle: 'Reflection Prompts',
    safetyTitle: 'Grounding Note',
  },
  zh: {
    elementalTitle: '元素能量分析',
    dominantTitle: '主导能量',
    quoteTitle: '星辰低语',
    summaryTitle: '整体综合',
    cardsTitle: '逐张解读',
    adviceTitle: '行动指引',
    mantraTitle: '锚定语',
    followUpsTitle: '反思提问',
    safetyTitle: '落地提醒',
  },
};

const barColors = {
  Fire: 'bg-gradient-to-t from-rose-500/90 to-amber-500/90 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
  Water: 'bg-gradient-to-t from-sky-500/90 to-indigo-500/90 shadow-[0_0_12px_rgba(14,165,233,0.4)]',
  Air: 'bg-gradient-to-t from-amber-200/90 to-yellow-400/90 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  Earth: 'bg-gradient-to-t from-emerald-500/90 to-teal-500/90 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
};
const loadingDots = ['delay-0', 'delay-150', 'delay-300'];

const StreamingPlaceholder = ({ text }) => (
  <span className="inline-flex items-center gap-2 text-sm text-gray-500 animate-pulse">
    <span>{text}</span>
    <span className="flex items-center gap-1">
      {loadingDots.map((delay) => (
        <span key={delay} className={`h-1.5 w-1.5 rounded-full bg-tarot-gold/70 animate-pulse ${delay}`}></span>
      ))}
    </span>
  </span>
);

const getPhaseTone = (status) => {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    case 'started':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    case 'triggered':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    case 'failed':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
    default:
      return 'border-white/10 bg-white/5 text-gray-300';
  }
};

const PhaseTimeline = ({ displayedPhases, orchestrationLabel, timelineState, t }) => {
  if (!displayedPhases.length && !orchestrationLabel) {
    return null;
  }

  return (
    <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-tarot-gold/80">
            {t?.('aiPhaseTimelineTitle') || 'Pipeline'}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            {timelineState?.hint || t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timelineState?.label && (
            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${timelineState.tone}`}>
              {timelineState.label}
            </span>
          )}
          {orchestrationLabel && (
            <span className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-3 py-1 text-xs uppercase tracking-widest text-tarot-gold/90">
              {t?.('aiOrchestrationLabel') || 'Mode'}: {orchestrationLabel}
            </span>
          )}
        </div>
      </div>

      {!!displayedPhases.length && (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          {displayedPhases.map((phase, index) => {
            const isActive = phase.status === 'started';
            const marker = phase.stage === 'fallback' ? '!' : String(index + 1);

            return (
              <div
                key={phase.stage}
                className={`min-h-[132px] rounded-xl border p-4 transition-all ${getPhaseTone(phase.status)} ${isActive ? 'shadow-[0_0_20px_rgba(56,189,248,0.15)]' : ''}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? 'animate-pulse border-current' : 'border-current/40'}`}>
                    {marker}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">
                    {phase.statusLabel}
                  </span>
                </div>
                <div className="text-sm font-medium leading-relaxed">
                  {phase.label}
                </div>
                {phase.detail && (
                  <p className="mt-3 text-xs leading-relaxed opacity-80">
                    {phase.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Interpretation = ({
  cards,
  language = 'en',
  reading,
  loading = false,
  phases = [],
  orchestration = null,
  onRetry,
  t,
}) => {
  const [activeCardTab, setActiveCardTab] = useState(0);
  const labels = labelsByLanguage[language];
  const resolvedReading = useMemo(() => reading || buildReading(cards, { language }), [cards, language, reading]);
  const resolvedOrchestration = orchestration || reading?.orchestration || resolvedReading?.orchestration || null;

  const displayedPhases = useMemo(() => {
    return getDisplayedPhases({
      phases,
      orchestration: resolvedOrchestration,
      language,
      loading,
      reading: resolvedReading,
    });
  }, [language, loading, phases, resolvedOrchestration, resolvedReading]);

  const timelineState = useMemo(() => getTimelineState({
    displayedPhases,
    orchestration: resolvedOrchestration,
    loading,
    t,
  }), [displayedPhases, loading, resolvedOrchestration, t]);

  if (!cards || cards.length < 3 || !resolvedReading) return null;

  const orchestrationLabel = getOrchestrationLabel(resolvedOrchestration, language);
  const sourceLabel = getReadingSourceLabel(resolvedReading.source, language, resolvedReading.providerLabel || '');
  const fallbackPhase = displayedPhases.find((phase) => phase.stage === 'fallback') || null;
  const fallbackDetail = typeof fallbackPhase?.detail === 'string' ? fallbackPhase.detail.trim() : '';
  const isLocalFallback = resolvedReading.source === 'local-fallback';
  const isServerFallback = resolvedReading.source === 'mock-server' || Boolean(fallbackPhase);
  const isStreaming = loading && Boolean(reading);
  const streamingLabel = timelineState?.kind === 'finalize-sync'
    ? (t?.('aiStreamingFinalize') || '定稿回传中...')
    : (t?.('aiStreaming') || t?.('aiRefreshing'));
  const placeholderLabel = t?.('aiStreamingPlaceholder') || 'Streaming...';

  if (loading && !reading) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl animate-fadeIn rounded-2xl border border-tarot-gold/20 bg-black/30 p-6 text-left md:p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-tarot-gold md:text-3xl">{t?.('interpretationTitle') || labels.summaryTitle}</h2>
            <p className="mt-2 text-sm text-gray-400">{t?.('aiLoading')}</p>
          </div>
          <div className="flex items-center gap-2">
            {loadingDots.map((delay) => (
              <span key={delay} className={`h-2.5 w-2.5 rounded-full bg-tarot-gold animate-pulse ${delay}`}></span>
            ))}
          </div>
        </div>
        <PhaseTimeline
          displayedPhases={displayedPhases}
          orchestrationLabel={orchestrationLabel}
          timelineState={timelineState}
          t={t}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-32 rounded-xl bg-white/5"></div>
          <div className="h-32 rounded-xl bg-white/5"></div>
          <div className="h-40 rounded-xl bg-white/5 md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl animate-fadeIn text-left font-serif text-gray-200">
      <div className="mb-4 rounded-xl border border-tarot-gold/30 bg-black/40 p-4 backdrop-blur-md md:mb-6 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl text-tarot-gold md:text-3xl">{t?.('interpretationTitle') || labels.summaryTitle}</h2>
            {resolvedReading.question && (
              <p className="mt-2 text-sm text-gray-300">
                {t?.('questionPrefix')} {resolvedReading.question}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <span className="rounded-full border border-tarot-gold/30 px-3 py-1 text-xs uppercase tracking-widest text-tarot-gold/80">
              {t?.('aiSourceLabel')}: {sourceLabel}
            </span>
            {orchestrationLabel && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-gray-300">
                {t?.('aiOrchestrationLabel') || 'Mode'}: {orchestrationLabel}
              </span>
            )}
            {resolvedReading.model && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-gray-300">
                {resolvedReading.model}
              </span>
            )}
            {isStreaming && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-gray-300">
                {streamingLabel}
              </span>
            )}
          </div>
        </div>
        {(isLocalFallback || isServerFallback) && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p>{isLocalFallback ? t?.('aiWarningFallback') : (t?.('aiWarningServerFallback') || t?.('aiWarningFallback'))}</p>
            {fallbackDetail && (
              <p className="mt-2 text-xs text-amber-100/80">
                {t?.('aiFallbackReasonLabel') || '原因'}: {fallbackDetail}
              </p>
            )}
          </div>
        )}
      </div>

      <PhaseTimeline
        displayedPhases={displayedPhases}
        orchestrationLabel={orchestrationLabel}
        timelineState={timelineState}
        t={t}
      />

      <div className="mb-4 rounded-xl border border-tarot-gold/30 bg-black/40 p-4 backdrop-blur-md md:mb-8 md:p-8">
        <h3 className="mb-6 border-b border-tarot-gold/20 pb-2 text-xl text-tarot-gold">{labels.elementalTitle}</h3>
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="flex h-32 w-full items-end justify-around gap-4 md:w-1/2">
            {resolvedReading.elementDistribution.map((stat) => (
              <div key={stat.key} className="flex h-full w-12 flex-col items-center justify-end gap-2">
                <span className="text-xs text-tarot-gold">{stat.percent}%</span>
                <div className="relative h-full w-full overflow-hidden rounded-t bg-white/10">
                  <div
                    className={`absolute bottom-0 w-full ${barColors[stat.key] || 'bg-white/30'} opacity-90 transition-all duration-700`}
                    style={{ height: `${stat.percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="text-center md:w-1/2 md:text-left">
            <h4 className="mb-1 text-sm uppercase tracking-widest text-gray-400">{labels.dominantTitle}</h4>
            <div className="mb-2 text-3xl font-bold text-tarot-gold">{resolvedReading.dominantElement.label}</div>
            <p className="text-sm italic text-gray-300 opacity-80">{resolvedReading.dominantElement.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border-l-4 border-tarot-gold bg-white/5 p-6 md:p-8">
        <h3 className="mb-4 text-center text-sm uppercase tracking-widest text-tarot-gold/80">{labels.quoteTitle}</h3>
        <div className="mb-6 text-center text-xl font-light italic leading-relaxed text-gray-100">
          {resolvedReading.quote || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
        </div>
        <h3 className="mb-3 font-bold text-tarot-gold">{labels.summaryTitle}</h3>
        <div className="leading-loose text-gray-300">
          {resolvedReading.summary || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
        </div>
      </div>

      <div className="mb-8 md:mb-12">
        <h3 className="mb-6 text-center text-xl tracking-[0.25em] text-tarot-gold/90">{labels.cardsTitle}</h3>
        
        {/* Premium Tab Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
          {resolvedReading.perCard.map((item, index) => {
            const isActive = activeCardTab === index;
            return (
              <button
                key={item.slot}
                onClick={() => setActiveCardTab(index)}
                className={`flex-1 rounded-xl px-4 py-3 text-center transition-all duration-300 ${
                  isActive
                    ? 'bg-tarot-gold/15 text-tarot-gold border border-tarot-gold/30 font-medium tab-glow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="text-xs uppercase tracking-widest opacity-60 mb-0.5">{item.slotLabel}</div>
                <div className="font-serif text-sm md:text-base flex items-center justify-center gap-1.5">
                  <span>{item.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.orientationLabel === '正位' || item.orientationLabel?.includes('Upright') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                    {item.orientationLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Card Content Container */}
        <div className="relative overflow-hidden min-h-[180px]">
          {resolvedReading.perCard.map((item, index) => {
            if (activeCardTab !== index) return null;
            return (
              <div
                key={item.slot}
                className="animate-fadeIn glass-panel rounded-2xl p-6 md:p-8 relative"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-tarot-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-4">
                  <div className="font-serif text-xl md:text-2xl text-tarot-gold font-semibold">
                    {item.slotLabel} · {item.title}
                  </div>
                  <div className="text-sm italic text-gray-400">
                    “{item.keyword}”
                  </div>
                </div>

                <p className="leading-loose text-gray-300 text-sm md:text-base font-serif pl-1">
                  {item.message || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        <div className="rounded-lg bg-white/5 p-6">
          <h3 className="mb-3 border-b border-white/10 pb-2 font-bold text-tarot-gold">{labels.adviceTitle}</h3>
          <div className="space-y-3 leading-relaxed text-gray-300">
            {resolvedReading.advice.length > 0
              ? resolvedReading.advice.map((item) => <p key={item}>• {item}</p>)
              : isStreaming
                ? <StreamingPlaceholder text={placeholderLabel} />
                : null}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-tarot-gold/10 p-6 text-center">
          <h3 className="mb-4 text-xs uppercase tracking-widest text-tarot-gold/60">{labels.mantraTitle}</h3>
          <div className="text-xl font-serif italic text-tarot-gold">
            {resolvedReading.mantra || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 font-bold text-tarot-gold">{labels.followUpsTitle}</h3>
        <div className="flex flex-wrap gap-3">
          {resolvedReading.followUps.length > 0
            ? resolvedReading.followUps.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                {item}
              </span>
            ))
            : isStreaming
              ? <StreamingPlaceholder text={placeholderLabel} />
              : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h3 className="mb-2 text-sm uppercase tracking-widest text-tarot-gold">{labels.safetyTitle}</h3>
          <div className="text-sm leading-relaxed text-gray-300">
            {resolvedReading.safetyNote || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="self-start rounded border border-tarot-gold px-4 py-2 text-tarot-gold transition-colors hover:bg-tarot-gold hover:text-tarot-bg md:self-auto"
          >
            {t?.('aiRetry')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Interpretation;
