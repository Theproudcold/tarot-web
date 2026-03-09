import { readingSlots } from '../../../src/lib/tarotReading.js';
import { runStructuredOpenAITask, streamStructuredOpenAITask } from '../providers/openaiProvider.js';
import { finalReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions } from './shared.js';

const buildFinalizeInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演“结果定稿”代理，负责吸收初稿与复核意见，产出最终可呈现给用户的定稿。'
    : 'You are the final-reading agent. Combine the draft and review notes into the final user-facing reading.',
  contractLines: language === 'zh'
    ? [
      '输出最终完整解读，字段必须齐全。',
      '优先保留初稿中已准确的部分，只吸收有依据的修订。',
      'quote、mantra、followUps 必须从本次牌阵与问题中提炼，读起来像这次专属，而不是抽象鸡汤或常见模板。',
      '不要为了证明“贴合牌阵”而机械塞入牌名、牌义关键词或教科书术语；如果要引用牌面信息，也要自然、含蓄、有画面。',
      '如果 draft、review 或 candidate 里的相关字段仍显泛化，请直接重写，不必为了保留原句而保留。',
      '避免复用高频表达，例如“答案在你心里”“宇宙会带路”“先回到自己，再决定方向”等可替换到任意牌阵的句子。',
      '最终文本要自然流畅、结构统一，并持续保持温和与非宿命论。',
    ]
    : [
      'Return the complete final reading with all required fields.',
      'Keep accurate parts of the draft and apply only revisions that are supported by the supplied card evidence.',
      'The quote, mantra, and followUps must be distilled from this spread and question so they feel bespoke rather than like abstract inspirational filler.',
      'Do not prove specificity by mechanically inserting card names, keywords, or textbook terminology; if card evidence appears, it should land naturally and keep the mystical texture alive.',
      'If draft, review, or candidate still contains generic wording in those fields, rewrite it directly instead of preserving it for smoothness.',
      'Avoid high-frequency stock phrasing such as “the answer is within you,” “the universe will guide you,” or “return to yourself before choosing.”',
      'The final text should feel coherent, natural, grounded, and non-fatalistic.',
    ],
});

const buildFinalizeInput = ({ context, draft, review, candidate }) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请综合上下文、初稿和复核意见，输出最终定稿。',
      'candidate 是已按 revisionPlan 合并后的候选稿，可参考但不要盲从。',
      '如果星辰低语、锚定语或反思提问还像模板句，请优先把它们改成更贴合当前牌阵的表达。',
    ]
    : [
      'Produce the final reading from the context, draft, and review notes.',
      'candidate is a mechanically merged revision candidate; use it as a helpful reference rather than a strict template.',
      'If the quote, mantra, or follow-up prompts still feel templated, rewrite them so they match the specific spread more tightly.',
    ],
  payload: {
    context,
    draft,
    review,
    candidate,
  },
});

const normalizePartialStringArray = (value, maxItems) => (
  Array.isArray(value)
    ? value
      .filter((item) => typeof item === 'string')
      .slice(0, maxItems)
    : undefined
);

const sanitizePartialFinalizePayload = (value) => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const nextValue = {};

  if (typeof value.summary === 'string') {
    nextValue.summary = value.summary;
  }

  if (typeof value.quote === 'string') {
    nextValue.quote = value.quote;
  }

  if (Array.isArray(value.perCard)) {
    const perCard = value.perCard
      .filter((item) => item && readingSlots.includes(item.slot) && typeof item.message === 'string')
      .map((item) => ({
        slot: item.slot,
        message: item.message,
      }))
      .slice(0, 3);

    if (perCard.length > 0) {
      nextValue.perCard = perCard;
    }
  }

  const advice = normalizePartialStringArray(value.advice, 3);
  if (advice?.length) {
    nextValue.advice = advice;
  }

  const followUps = normalizePartialStringArray(value.followUps, 4);
  if (followUps?.length) {
    nextValue.followUps = followUps;
  }

  if (typeof value.mantra === 'string') {
    nextValue.mantra = value.mantra;
  }

  if (typeof value.safetyNote === 'string') {
    nextValue.safetyNote = value.safetyNote;
  }

  return nextValue;
};

const createFinalizeTaskConfig = ({ context, draft, review, candidate, aiConfig }) => ({
  aiConfig,
  schemaName: 'tarot_final_reading',
  schema: finalReadingJsonSchema,
  instructions: buildFinalizeInstructions(context.language),
  input: buildFinalizeInput({ context, draft, review, candidate }),
  temperature: 0.5,
});

export const runFinalizeAgent = async ({ context, draft, review, candidate, aiConfig }) => runStructuredOpenAITask(
  createFinalizeTaskConfig({ context, draft, review, candidate, aiConfig })
);

export const streamFinalizeAgent = async ({ context, draft, review, candidate, aiConfig, onPartialReading }) => {
  const taskConfig = createFinalizeTaskConfig({ context, draft, review, candidate, aiConfig });

  try {
    const result = await streamStructuredOpenAITask({
      ...taskConfig,
      partialParser: sanitizePartialFinalizePayload,
      onPartialObject: async (partialObject, meta) => {
        if (typeof onPartialReading === 'function') {
          await onPartialReading(partialObject, meta);
        }
      },
    });

    return {
      ...result,
      streamed: true,
    };
  } catch (error) {
    console.warn('Finalize streaming failed, falling back to buffered finalize:', error);

    const result = await runStructuredOpenAITask(taskConfig);
    return {
      ...result,
      streamed: false,
    };
  }
};
