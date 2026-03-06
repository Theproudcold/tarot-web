import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { draftReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions } from './shared.js';

const buildDraftInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演“牌意起稿”代理，负责先给出一版结构清晰、证据充分的塔罗解读初稿。'
    : 'You are the card-draft agent. Produce a first-pass tarot interpretation that is structured, evidence-based, and reflective.',
  contractLines: language === 'zh'
    ? [
      '输出用户可直接阅读的完整初稿。',
      '每个结论都必须能从给定牌义、正逆位、位置或元素分布中找到依据。',
      '保持温和、具体、可执行，不要使用宿命式语气。',
    ]
    : [
      'Return a complete user-facing first draft.',
      'Every conclusion must be grounded in the provided card meanings, orientation, spread position, or element distribution.',
      'Keep the tone specific, gentle, and actionable without sounding fatalistic.',
    ],
});

const buildDraftInput = (context) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请根据下面的塔罗上下文起草完整解读。',
      '优先做到：结构完整、每张牌都有新信息、总结与建议彼此一致。',
    ]
    : [
      'Draft a complete tarot reading from the context below.',
      'Prioritize completeness, grounded per-card insight, and consistency between summary and advice.',
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
