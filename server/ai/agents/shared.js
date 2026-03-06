import { computeElementDistribution } from '../../../src/lib/tarotReading.js';
import { buildCardContext, buildGroundedInstructions, buildJsonContract } from '../providers/openaiProvider.js';

const getLocalizedText = (language, zhText, enText) => (language === 'zh' ? zhText : enText);

export const buildAgentContext = ({ cards, language, question, previousReading }) => {
  const elemental = computeElementDistribution(cards, language);

  return {
    language,
    question: question || null,
    dominantElement: elemental.dominantElement,
    elementDistribution: elemental.distribution,
    cards: buildCardContext(cards, language),
    previousReading: previousReading ? {
      summary: previousReading.summary,
      advice: previousReading.advice,
      followUps: previousReading.followUps,
      mantra: previousReading.mantra,
    } : null,
  };
};

export const buildAgentInstructions = ({ language, roleLine, contractLines = [] }) => [
  buildGroundedInstructions(language),
  roleLine,
  buildJsonContract(language, contractLines),
].join(' ');

export const buildAgentInput = ({ introLines, payload }) => [
  ...introLines,
  '',
  JSON.stringify(payload, null, 2),
].join('\n');

export const getPhaseLabel = (stage, language = 'zh') => {
  const labels = {
    draft: getLocalizedText(language, '中书省起草', 'Draft ministry'),
    review: getLocalizedText(language, '门下省复核', 'Review ministry'),
    finalize: getLocalizedText(language, '尚书省定稿', 'Finalize ministry'),
    fallback: getLocalizedText(language, '降级回退', 'Fallback'),
  };

  return labels[stage] || stage;
};

export const normalizeReviewPayload = (value) => ({
  strengths: Array.isArray(value?.strengths)
    ? value.strengths.filter((item) => typeof item === 'string' && item.trim())
    : [],
  risks: Array.isArray(value?.risks)
    ? value.risks.filter((item) => typeof item === 'string' && item.trim())
    : [],
  revisionPlan: value?.revisionPlan && typeof value.revisionPlan === 'object'
    ? value.revisionPlan
    : {},
});
