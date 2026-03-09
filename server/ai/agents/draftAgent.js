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
      '在 perCard 中构建连贯的【时间脉络】：梳理过去与现在的逻辑关系，并指出当前选择如何影响未来。',
      '请使用具体的牌义意象来构建 advice（例如指出“把目光放在更远的市场或下一个行动节点上”，而非泛化表达“先回到自己”）。',
      'advice 层级：至少提供一条【立刻能做的微小行动】和一条【认知视角的转换】。',
      'followUps 问题层级：第一问探索显性的情绪阻碍，第二问直指问题的核心矛盾。',
      'quote 和 mantra 要精确切中痛点，像是专门为这次占卜写的箴言，杜绝可复用的空泛鸡汤。',
      '如存在 previousReading，只把它当连续对话背景，不要沿用其中的措辞。',
      '保持温和、具体、可执行，不要使用宿命式语气。',
    ]
    : [
      'Return a complete user-facing first draft.',
      'Build a cohesive 【timeline narrative】 in perCard: illustrate the logical relation between Past and Present, and how the Present choice impacts the Future.',
      'Use specific card imagery for advice (e.g., specify "focus on distant markets" instead of a generic "return to yourself").',
      'advice layers: Include at least one immediate 【micro-action】 and one 【cognitive shift】.',
      'followUps progression: Start with surfacing explicit emotional blocks, then probe the core contradiction.',
      'Make quote and mantra highly bespoke stingers to this exact reading rather than interchangeable inspirational texts.',
      'If previousReading exists, treat it only as continuity context and do not reuse its wording.',
      'Keep the tone specific, gentle, and actionable without sounding fatalistic.',
    ],
});

const buildDraftInput = (context) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请根据下面的塔罗上下文起草完整解读。',
      '优先做到：连贯的时间脉络演绎、有卡牌图像依据的具体建议（避免空话）。',
      '如果 elementDistribution 存在明显的元素冲突或单极化危险，请在 summary 处重点提示。',
    ]
    : [
      'Draft a complete tarot reading from the context below.',
      'Prioritize: a cohesive timeline narrative, and specific advice grounded in card imagery (avoid platitudes).',
      'If the elementDistribution shows severe conflict or single-element imbalance, highlight it in the summary.',
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
