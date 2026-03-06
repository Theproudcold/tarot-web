import { mergeReadingWithBase } from '../../src/lib/readingContract.js';
import { buildReading } from '../../src/lib/tarotReading.js';
import { runDraftAgent } from './agents/draftAgent.js';
import { streamFinalizeAgent } from './agents/finalizeAgent.js';
import { runReviewAgent } from './agents/reviewAgent.js';
import { buildAgentContext, getPhaseLabel } from './agents/shared.js';
import { getErrorDetail } from './errorUtils.js';

const pipelineStages = ['draft', 'review', 'finalize'];
const draftPipelineStages = ['draft'];
const reviewPipelineStages = ['draft', 'review'];

const emitPhase = async (onPhase, language, stage, status, extra = {}) => {
  if (typeof onPhase !== 'function') {
    return;
  }

  await onPhase({
    stage,
    status,
    label: getPhaseLabel(stage, language),
    timestamp: new Date().toISOString(),
    ...extra,
  });
};

const emitReadingSnapshot = async (onPartialReading, reading, stage) => {
  if (typeof onPartialReading !== 'function' || !reading) {
    return;
  }

  await onPartialReading({
    reading,
    stage,
    timestamp: new Date().toISOString(),
  });
};

export const runMultiAgentReading = async (payload, options = {}) => {
  const {
    cards,
    language,
    question,
    createdAt,
    previousReading,
    aiConfig,
  } = payload;
  const { onPhase, onPartialReading } = options;

  const context = buildAgentContext({
    cards,
    language,
    question,
    previousReading,
  });

  await emitPhase(onPhase, language, 'draft', 'started');
  let draftResult;

  try {
    draftResult = await runDraftAgent({ context, aiConfig });
  } catch (error) {
    await emitPhase(onPhase, language, 'draft', 'failed', {
      detail: getErrorDetail(error, 'Draft agent failed'),
    });
    throw error;
  }
  await emitPhase(onPhase, language, 'draft', 'completed', {
    provider: draftResult.source,
    model: draftResult.model,
  });

  const draftBaseReading = buildReading(cards, {
    language,
    question,
    createdAt,
    source: draftResult.source,
    model: draftResult.model,
  });

  const candidateReading = mergeReadingWithBase(draftBaseReading, draftResult.parsed, {
    source: draftResult.source,
    model: draftResult.model,
    question,
    createdAt,
    orchestration: 'multi',
    agentPipeline: draftPipelineStages,
  });

  await emitReadingSnapshot(onPartialReading, candidateReading, 'draft');

  await emitPhase(onPhase, language, 'review', 'started');
  let reviewResult;

  try {
    reviewResult = await runReviewAgent({
      context,
      draft: draftResult.parsed,
      aiConfig,
    });
  } catch (error) {
    await emitPhase(onPhase, language, 'review', 'failed', {
      detail: getErrorDetail(error, 'Review agent failed'),
    });
    throw error;
  }
  await emitPhase(onPhase, language, 'review', 'completed', {
    provider: reviewResult.source,
    model: reviewResult.model,
  });

  const reviewNotes = {
    strengths: reviewResult.parsed.strengths,
    risks: reviewResult.parsed.risks,
  };

  const revisedCandidate = mergeReadingWithBase(candidateReading, reviewResult.parsed.revisionPlan, {
    source: draftResult.source,
    model: draftResult.model,
    question,
    createdAt,
    orchestration: 'multi',
    agentPipeline: reviewPipelineStages,
    reviewNotes,
  });

  await emitReadingSnapshot(onPartialReading, revisedCandidate, 'review');

  await emitPhase(onPhase, language, 'finalize', 'started');
  let finalResult;

  try {
    finalResult = await streamFinalizeAgent({
      context,
      draft: draftResult.parsed,
      review: reviewResult.parsed,
      candidate: revisedCandidate,
      aiConfig,
      onPartialReading: async (partialReading, meta = {}) => {
        const nextSnapshot = {
          ...partialReading,
          source: meta.source,
          model: meta.model,
          orchestration: 'multi',
          agentPipeline: pipelineStages,
          reviewNotes,
        };

        await emitReadingSnapshot(onPartialReading, nextSnapshot, 'finalize');
      },
    });
  } catch (error) {
    await emitPhase(onPhase, language, 'finalize', 'failed', {
      detail: getErrorDetail(error, 'Finalize agent failed'),
    });
    throw error;
  }
  await emitPhase(onPhase, language, 'finalize', 'completed', {
    provider: finalResult.source,
    model: finalResult.model,
  });

  const finalBaseReading = buildReading(cards, {
    language,
    question,
    createdAt,
    source: finalResult.source,
    model: finalResult.model,
  });

  return {
    reading: mergeReadingWithBase(finalBaseReading, finalResult.parsed, {
      source: finalResult.source,
      model: finalResult.model,
      question,
      createdAt,
      orchestration: 'multi',
      agentPipeline: pipelineStages,
      reviewNotes,
    }),
    nativeFinalStream: finalResult.streamed,
  };
};
