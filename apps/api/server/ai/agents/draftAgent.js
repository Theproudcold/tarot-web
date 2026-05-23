import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { draftReadingJsonSchema } from './agentSchemas.js';
import { buildFewShotBlock } from './fewShotExamples.js';
import { buildAgentInput, buildAgentInstructions } from './shared.js';

const buildReasoningGuidance = (language) => {
  if (language === 'zh') {
    return [
      '【内部推理流程】在生成输出之前，先在内部完成以下三步思考（不要在输出中展示）：',
      '1. 识别三张牌之间的元素张力和叙事弧线：它们在讲一个什么故事？冲突在哪里？转折在哪里？',
      '2. 找到牌面意象与用户问题的"锚点"：哪张牌最直接回应了用户的困惑？哪个关键词能击中痛点？',
      '3. 规划 advice 的层级架构：第一条是"今天就能做的微行动"，第二条是"认知视角的转换"。',
    ].join('\n');
  }

  return [
    '【Internal Reasoning Process】Before generating output, complete these three thinking steps internally (do not include them in the output):',
    '1. Identify elemental tensions and the narrative arc among the three cards: What story do they tell? Where is the conflict? Where is the turning point?',
    '2. Find the anchor between card imagery and the user\'s question: Which card most directly addresses the querent\'s concern? Which keyword hits the emotional core?',
    '3. Plan the advice hierarchy: The first piece should be a "micro-action doable today," the second a "cognitive perspective shift."',
  ].join('\n');
};

const buildDraftInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演"牌意起稿"代理，负责先给出一版结构清晰、证据充分且具备本次牌阵独特性的塔罗解读初稿。'
    : 'You are the card-draft agent. Produce a first-pass tarot interpretation that is structured, evidence-based, and clearly distinctive to this spread.',
  reasoningGuidance: buildReasoningGuidance(language),
  fewShotBlock: buildFewShotBlock(language),
  contractLines: language === 'zh'
    ? [
      '输出用户可直接阅读的完整初稿。',
      '在 perCard 中构建连贯的【时间脉络】：梳理过去与现在的逻辑关系，并指出当前选择如何影响未来。',
      'advice 层级（必须返回 JSON 数组）：至少提供一条【立刻能做的微小行动】和一条【认知视角的转换】。',
      'followUps 问题层级（必须返回 JSON 数组）：第一问探索显性的情绪阻碍，第二问直指问题的核心矛盾。',
      '请使用具体的牌义意象来构建 advice（例如指出"把目光放在更远的市场或下一个行动节点上"，而非泛化表达"先回到自己"）。',
      'quote、mantra、followUps 必须通过"可替换性测试"——如果换到另一个牌阵依然成立，就重写。杜绝可复用的空泛鸡汤和模板句。',
      '自检清单：写完后逐条检查每个字段是否包含本次牌面的具体牌名、关键词或元素意象，不含则重写。',
      '如存在 previousReading，只把它当连续对话背景，不要沿用其中的措辞。',
      '不要为了显得"贴合牌阵"而机械堆砌牌名、关键词或教科书术语，牌面信息需自然融入叙事。',
      '保持温和、具体、可执行，不要使用宿命式语气。',
    ]
    : [
      'Return a complete user-facing first draft.',
      'Build a cohesive 【timeline narrative】 in perCard: illustrate the logical relation between Past and Present, and how the Present choice impacts the Future.',
      'advice layers (must be a JSON array): Include at least one immediate 【micro-action】 and one 【cognitive shift】.',
      'followUps progression (must be a JSON array): Start with surfacing explicit emotional blocks, then probe the core contradiction.',
      'Use specific card imagery for advice (e.g., specify "focus on distant markets" instead of a generic "return to yourself").',
      'quote, mantra, and followUps must pass the "substitutability test"—if they would still work in any other spread, rewrite them. No interchangeable inspirational texts or template sentences.',
      'Self-check: after writing, verify each field contains specific card names, keywords, or elemental imagery from this spread; if not, rewrite.',
      'If previousReading exists, treat it only as continuity context and do not reuse its wording.',
      'Do not prove specificity by mechanically stacking card names, keywords, or textbook terminology; card evidence should land naturally within the narrative.',
      'Keep the tone specific, gentle, and actionable without sounding fatalistic.',
    ],
});

const buildDraftInput = (context) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请根据下面的塔罗上下文起草完整解读。',
      '优先做到：连贯的时间脉络演绎、有卡牌图像依据的具体建议（避免空话）。',
      '如果 elementDistribution 存在明显的元素冲突或单极化危险，请在 summary 处重点提示。',
      '特别注意：星辰低语（quote）和锚定语（mantra）必须体现本次牌阵的独特张力，不要写成放之四海皆准的箴言。',
    ]
    : [
      'Draft a complete tarot reading from the context below.',
      'Prioritize: a cohesive timeline narrative, and specific advice grounded in card imagery (avoid platitudes).',
      'If the elementDistribution shows severe conflict or single-element imbalance, highlight it in the summary.',
      'Pay special attention: the quote and mantra must reflect the unique tension of this specific spread, not generic wisdom.',
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
