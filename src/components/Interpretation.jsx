import React, { useMemo } from 'react';
import { getOrchestrationLabel } from '../lib/orchestrationLabels.js';
import { getReadingSourceLabel } from '../lib/readingSource.js';
import { buildReading } from '../lib/tarotReading';

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

const phaseLabelsByLanguage = {
  en: {
    draft: 'Card draft',
    review: 'Reading review',
    finalize: 'Final reading',
    fallback: 'Fallback',
  },
  zh: {
    draft: '牌意起稿',
    review: '解读复核',
    finalize: '结果定稿',
    fallback: '降级回退',
  },
};

const phaseStatusLabelsByLanguage = {
  en: {
    pending: 'Pending',
    started: 'In Progress',
    completed: 'Completed',
    triggered: 'Triggered',
    failed: 'Failed',
  },
  zh: {
    pending: '等待中',
    started: '进行中',
    completed: '已完成',
    triggered: '已触发',
    failed: '失败',
  },
};

const barColors = {
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Air: 'bg-yellow-400',
  Earth: 'bg-green-500',
};

const phaseOrder = ['draft', 'review', 'finalize', 'fallback'];
const pipelineStages = ['draft', 'review', 'finalize'];
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
                className={`rounded-xl border p-4 transition-all ${getPhaseTone(phase.status)} ${isActive ? 'shadow-[0_0_20px_rgba(56,189,248,0.15)]' : ''}`}
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
  const labels = labelsByLanguage[language];
  const phaseLabels = phaseLabelsByLanguage[language] || phaseLabelsByLanguage.en;
  const phaseStatusLabels = phaseStatusLabelsByLanguage[language] || phaseStatusLabelsByLanguage.en;
  const resolvedReading = useMemo(() => reading || buildReading(cards, { language }), [cards, language, reading]);
  const resolvedOrchestration = orchestration || reading?.orchestration || resolvedReading?.orchestration || null;

  const displayedPhases = useMemo(() => {
    const phaseMap = new Map(
      (phases || [])
        .filter((item) => item?.stage)
        .map((item) => [item.stage, item])
    );

    const completedPipelineStages = Array.isArray(resolvedReading?.agentPipeline)
      ? resolvedReading.agentPipeline.filter((stage) => pipelineStages.includes(stage))
      : [];

    if (!loading && completedPipelineStages.length > 0) {
      completedPipelineStages.forEach((stage) => {
        const phase = phaseMap.get(stage);
        phaseMap.set(stage, {
          ...phase,
          stage,
          status: 'completed',
          label: phaseLabels[stage] || phase?.label || stage,
        });
      });
    }

    const hasPipelinePhases = pipelineStages.some((stage) => phaseMap.has(stage));

    const defaultStages = resolvedOrchestration === 'multi' || hasPipelinePhases
      ? pipelineStages
      : [];

    const items = defaultStages.map((stage) => {
      const phase = phaseMap.get(stage);
      return {
        stage,
        label: phase?.label || phaseLabels[stage],
        status: phase?.status || 'pending',
        statusLabel: phaseStatusLabels[phase?.status || 'pending'] || phaseStatusLabels.pending,
        detail: phase?.detail || '',
      };
    });

    if (phaseMap.has('fallback')) {
      const phase = phaseMap.get('fallback');
      items.push({
        stage: 'fallback',
        label: phaseLabels.fallback || phase?.label || 'fallback',
        status: phase?.status || 'triggered',
        statusLabel: phaseStatusLabels[phase?.status || 'triggered'] || phaseStatusLabels.triggered,
        detail: phase?.detail || '',
      });
    }

    if (items.length > 0) {
      return items;
    }

    return [...phaseMap.values()]
      .sort((left, right) => phaseOrder.indexOf(left.stage) - phaseOrder.indexOf(right.stage))
      .map((phase) => ({
        ...phase,
        label: phaseLabels[phase.stage] || phase.label || phase.stage,
        statusLabel: phaseStatusLabels[phase.status] || phaseStatusLabels.pending,
        detail: phase.detail || '',
      }));
  }, [loading, phaseLabels, phaseStatusLabels, phases, resolvedOrchestration, resolvedReading]);

  const timelineState = useMemo(() => {
    const activePhases = displayedPhases.filter((phase) => pipelineStages.includes(phase.stage));
    const failedPhase = activePhases.find((phase) => phase.status === 'failed');
    const fallbackPhase = displayedPhases.find((phase) => phase.stage === 'fallback');
    const hasFallback = Boolean(fallbackPhase);
    const expectsFullPipeline = resolvedOrchestration === 'multi';
    const hasFullPipeline = !expectsFullPipeline || activePhases.length === pipelineStages.length;
    const isComplete = hasFullPipeline && activePhases.length > 0 && activePhases.every((phase) => phase.status === 'completed');
    const isRunning = activePhases.some((phase) => phase.status === 'started');
    const isWaiting = activePhases.some((phase) => phase.status === 'pending');

    if (loading && isComplete) {
      return {
        kind: 'finalize-sync',
        label: t?.('aiPhaseTimelineDone') || '流程已完成',
        hint: t?.('aiPhaseTimelineFinalizeStreaming') || '三段流程已结束，当前仅在同步最终文本。',
        tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
      };
    }

    if (hasFallback) {
      return {
        kind: 'fallback',
        label: t?.('aiPhaseTimelineFallback') || '已回退',
        hint: fallbackPhase?.detail || failedPhase?.detail || t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.',
        tone: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
      };
    }

    if (failedPhase) {
      return {
        kind: 'failed',
        label: t?.('aiPhaseTimelineFailed') || '阶段失败',
        hint: failedPhase.detail || t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.',
        tone: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
      };
    }

    if (isComplete) {
      return {
        kind: 'completed',
        label: t?.('aiPhaseTimelineDone') || '流程已完成',
        hint: t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.',
        tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
      };
    }

    if (loading || isRunning || isWaiting) {
      return {
        kind: 'running',
        label: t?.('aiPhaseTimelineRunning') || '流程进行中',
        hint: t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.',
        tone: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
      };
    }

    return {
      kind: 'idle',
      label: null,
      hint: t?.('aiPhaseTimelineHint') || 'Track the current interpretation stage.',
      tone: 'border-white/10 bg-white/5 text-gray-300',
    };
  }, [displayedPhases, loading, resolvedOrchestration, t]);

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
                    className={`absolute bottom-0 w-full ${barColors[stat.key] || 'bg-white/30'} opacity-70 transition-all duration-700`}
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
        <h3 className="mb-8 text-center text-2xl tracking-[0.2em] text-tarot-gold">{labels.cardsTitle}</h3>
        <div className="space-y-6">
          {resolvedReading.perCard.map((item, index) => (
            <div
              key={item.slot}
              className={`rounded-lg p-6 ${index === 1 ? 'border-l-4 border-tarot-gold bg-gradient-to-r from-tarot-gold/20 to-transparent' : 'border-t border-white/10 bg-gradient-to-r from-black/60 to-transparent'}`}
            >
              <h4 className="mb-2 text-lg text-tarot-gold">
                {item.slotLabel} · {item.title} · {item.orientationLabel}
              </h4>
              <p className="border-l-2 border-white/20 pl-4 leading-relaxed text-gray-300">
                “{item.keyword}”
                <br />
                <span className="mt-3 block text-sm opacity-80">
                  {item.message || (isStreaming ? <StreamingPlaceholder text={placeholderLabel} /> : null)}
                </span>
              </p>
            </div>
          ))}
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
