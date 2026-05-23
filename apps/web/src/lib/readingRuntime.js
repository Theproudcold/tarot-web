const pipelineStages = ['draft', 'review', 'finalize'];
const phaseOrder = ['draft', 'review', 'finalize', 'fallback'];

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

const sortPhases = (phases) => [...phases].sort((left, right) => {
  const leftIndex = phaseOrder.indexOf(left.stage);
  const rightIndex = phaseOrder.indexOf(right.stage);

  return (leftIndex === -1 ? phaseOrder.length : leftIndex)
    - (rightIndex === -1 ? phaseOrder.length : rightIndex);
});

export const getDisplayedPhases = ({
  phases = [],
  orchestration = null,
  language = 'en',
  loading = false,
  reading = null,
} = {}) => {
  const phaseLabels = phaseLabelsByLanguage[language] || phaseLabelsByLanguage.en;
  const statusLabels = phaseStatusLabelsByLanguage[language] || phaseStatusLabelsByLanguage.en;
  const phaseMap = new Map(
    (phases || [])
      .filter((item) => item?.stage)
      .map((item) => [item.stage, item])
  );

  const completedPipelineStages = Array.isArray(reading?.agentPipeline)
    ? reading.agentPipeline.filter((stage) => pipelineStages.includes(stage))
    : [];

  if (!loading && completedPipelineStages.length > 0) {
    completedPipelineStages.forEach((stage) => {
      const phase = phaseMap.get(stage);
      phaseMap.set(stage, {
        ...phase,
        stage,
        status: phase?.status === 'failed' ? 'failed' : 'completed',
        label: phaseLabels[stage] || phase?.label || stage,
      });
    });
  }

  const hasPipelinePhases = pipelineStages.some((stage) => phaseMap.has(stage));
  const defaultStages = orchestration === 'multi' || hasPipelinePhases
    ? pipelineStages
    : [];

  const items = defaultStages.map((stage) => {
    const phase = phaseMap.get(stage);

    return {
      stage,
      label: phase?.label || phaseLabels[stage],
      status: phase?.status || 'pending',
      statusLabel: statusLabels[phase?.status || 'pending'] || statusLabels.pending,
      detail: phase?.detail || '',
    };
  });

  if (phaseMap.has('fallback')) {
    const phase = phaseMap.get('fallback');
    items.push({
      stage: 'fallback',
      label: phaseLabels.fallback || phase?.label || 'fallback',
      status: phase?.status || 'triggered',
      statusLabel: statusLabels[phase?.status || 'triggered'] || statusLabels.triggered,
      detail: phase?.detail || '',
    });
  }

  if (items.length > 0) {
    return items;
  }

  return sortPhases([...phaseMap.values()]).map((phase) => ({
    ...phase,
    label: phaseLabels[phase.stage] || phase.label || phase.stage,
    statusLabel: statusLabels[phase.status] || statusLabels.pending,
    detail: phase.detail || '',
  }));
};

export const getTimelineState = ({
  displayedPhases = [],
  orchestration = null,
  loading = false,
  t,
} = {}) => {
  const activePhases = displayedPhases.filter((phase) => pipelineStages.includes(phase.stage));
  const failedPhase = activePhases.find((phase) => phase.status === 'failed');
  const fallbackPhase = displayedPhases.find((phase) => phase.stage === 'fallback');
  const expectsFullPipeline = orchestration === 'multi';
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

  if (fallbackPhase) {
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
};
