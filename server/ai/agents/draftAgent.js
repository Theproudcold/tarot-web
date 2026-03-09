import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { draftReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions } from './shared.js';

const buildDraftInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演“牌意起稿”代理，负责先给出一版结构清晰、证据充分且具备本次牌阵独特性的塔罗解读初稿。'
    : 'You are the card-draft agent. Produce a first-pass tarot interpretation that is structured, evidence-based, and clearly distinctive to this spread.',
  contractLines: language === 'zh'
    ? [
      '输出用户可直接阅读的完整初稿。',
      '每个结论都必须能从给定牌义、正逆位、位置或元素分布中找到依据。',
      'quote、mantra、followUps 必须紧扣当前这组三张牌与用户问题，像是为这次牌阵单独写下，而不是能套用到任意解读里的套话。',
      '具体不等于机械堆砌牌名、牌义关键词或教科书术语；如果引用牌面信息，也要自然地融入句子，保留神秘感与画面感。',
      '避免高频空话或宇宙/命运类鸡汤，例如“答案在你心里”“先回到自己，再决定方向”“温柔行动”等泛化表达。',
      '如存在 previousReading，只把它当连续对话背景，不要沿用其中的措辞来生成新的 quote、mantra 或 followUps。',
      '保持温和、具体、可执行，不要使用宿命式语气。',
    ]
    : [
      'Return a complete user-facing first draft.',
      'Every conclusion must be grounded in the provided card meanings, orientation, spread position, or element distribution.',
      'Make quote, mantra, and followUps feel bespoke to this spread and question rather than interchangeable with any generic reading.',
      'Specificity does not mean mechanically stuffing in card names, keywords, or textbook terminology; if you reference card evidence, weave it in naturally and keep the mystique intact.',
      'Avoid stock cosmic language or repeated self-help phrasing such as “the answer is within you,” “return to yourself,” or other interchangeable platitudes.',
      'If previousReading exists, treat it only as continuity context and do not reuse its wording for the new quote, mantra, or followUps.',
      'Keep the tone specific, gentle, and actionable without sounding fatalistic.',
    ],
});

const buildDraftInput = (context) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请根据下面的塔罗上下文起草完整解读。',
      '优先做到：结构完整、每张牌都有新信息、总结与建议彼此一致。',
      '尤其让星辰低语、锚定语和反思提问体现这次牌阵的独特张力，不要写成任何牌阵都能复用的句子。',
    ]
    : [
      'Draft a complete tarot reading from the context below.',
      'Prioritize completeness, grounded per-card insight, and consistency between summary and advice.',
      'Make the quote, mantra, and follow-up prompts express the specific tension of this spread rather than reusable generic lines.',
    ],
  payload: context,
});

export const runDraftAgent = async ({ context, aiConfig }) => runStructuredOpenAITask({
  aiConfig,
  schemaName: 'tarot_draft_reading',
  schema: draftReadingJsonSchema,
  instructions: buildDraftInstructions(context.language),
  input: buildDraftInput(context),
  temperature: 0.7,
});
