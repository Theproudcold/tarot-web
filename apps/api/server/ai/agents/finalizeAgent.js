import { readingSlots } from '../../../src/lib/tarotReading.js';
import { runStructuredOpenAITask, streamStructuredOpenAITask } from '../providers/openaiProvider.js';
import { finalReadingJsonSchema } from './agentSchemas.js';
import { buildContrastBlock } from './fewShotExamples.js';
import { buildAgentInput, buildAgentInstructions } from './shared.js';

const buildFinalizeInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演"结果定稿"代理，负责吸收初稿与复核意见，产出最终可呈现给用户的定稿。'
    : 'You are the final-reading agent. Combine the draft and review notes into the final user-facing reading.',
  fewShotBlock: buildContrastBlock(language),
  contractLines: language === 'zh'
    ? [
      '输出最终完整解读，字段必须齐全。',
      '优先保留初稿中已准确的部分，只吸收有依据的修订。',
      '再次确认 perCard 中有连贯的【时间脉络】。',
      '再次确认 advice/followUps 具有【层级划分】并且必须是 JSON 数组结构。',
      'quote、mantra 必须像为这次专属求问写出的箴言，杜绝"答案在你心里""顺其自然""相信自己"等可复用套话。',
      '不要为了证明"贴合牌阵"而机械塞入牌名或教科书术语；如果要引用牌面信息，需自然并保留神秘画面感。',
      '如果 draft、review 或 candidate 里的相关字段仍显空泛套路，请直接果断重写，不必为了保留原句而保留——重写时参考上方的质量对照示例。',
      '终极自检：对最终稿的每个字段做"可替换性测试"，不通过则重写。',
      '最终文本要自然流畅、结构统一，并持续保持具体与非宿命论。',
    ]
    : [
      'Return the complete final reading with all required fields.',
      'Keep accurate parts of the draft and apply only revisions that are supported by the supplied card evidence.',
      'Double-check that a cohesive 【timeline narrative】 exists across the perCard interpretations.',
      'Double-check that advice and followUps have clear 【layered progression】 and are formatted as JSON Arrays.',
      'The quote and mantra must be bespoke stingers to this exact spread, not abstract filler like "the answer is within you" or "trust the process."',
      'Do not prove specificity by mechanically inserting card terminology; if card evidence appears, it should land naturally and keep the mystical texture alive.',
      'If draft, review, or candidate still contains generic or platitude-like wording in those fields, rewrite them decisively—refer to the quality contrast examples above for guidance.',
      'Final self-check: apply the "substitutability test" to every field in the final output; rewrite anything that does not pass.',
      'The final text should feel coherent, action-oriented, natural, and non-fatalistic.',
    ],
});

const buildFinalizeInput = ({ context, draft, review, candidate }) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请综合上下文、初稿和复核意见，输出最终定稿。',
      'candidate 是已按 revisionPlan 合并后的候选稿，可参考但不要盲从。',
      '如果星辰低语、锚定语或反思提问还像模板句，请优先把它们改成更贴合当前牌阵的表达——对照上方的"不合格 vs 合格"示例来判断。',
      '最后对所有输出字段做一次"可替换性测试"：如果这段文字换到另一个牌阵依然成立，就必须重写。',
    ]
    : [
      'Produce the final reading from the context, draft, and review notes.',
      'candidate is a mechanically merged revision candidate; use it as a helpful reference rather than a strict template.',
      'If the quote, mantra, or follow-up prompts still feel templated, rewrite them referencing the "unacceptable vs acceptable" contrast examples above.',
      'Apply the "substitutability test" to all output fields: if a passage would still work in any other spread, rewrite it.',
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
