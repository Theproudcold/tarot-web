import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { reviewReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions, normalizeReviewPayload } from './shared.js';

const buildReviewInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演“解读复核”代理，负责审读初稿，指出优点、风险，并给出必要的修订方案。'
    : 'You are the reading-review agent. Audit the draft, identify strengths and risks, and propose only the revisions that materially improve the reading.',
  contractLines: language === 'zh'
    ? [
      '不要重写整篇解读，只返回 strengths、risks、revisionPlan。',
      '只有当问题会明显损害准确性、独特性、可执行性或安全性时，才写入 revisionPlan。',
      '重点检查：时间脉络是否连贯、是否偏离牌义、是否过度断言、是否宿命化、advice/followUps 是否存在层级且不空泛。',
      '特别检查 quote、mantra 是否像模板句；如果是，必须在 risks 中指出，并在 revisionPlan 中重写相关字段使其更加锋利。',
      '如果为了显得“贴合牌阵”而机械堆砌牌名、关键词或教科书术语，也要视为风险，因为这会稀释神秘感与自然表达。',
      '如果某个字段已经足够贴合当前牌阵，不要为了“变化”而强行改写。',
      '如果某个字段无需修改，可以在 revisionPlan 中省略它。',
    ]
    : [
      'Do not rewrite the entire reading; return only strengths, risks, and revisionPlan.',
      'Only add something to revisionPlan when it materially harms accuracy, distinctiveness, actionability, or safety.',
      'Focus on timeline cohesiveness, card-evidence alignment, overclaiming, fatalistic language, and whether advice/followUps are layered.',
      'Specifically audit quote and mantra for generic template language; if found, call it out in risks and rewrite that field in revisionPlan to be sharper.',
      'Also flag any line that tries to prove specificity by mechanically stacking card names, keywords, or textbook terminology, because that kills the natural mystique.',
      'If a field is already well-tailored to this spread, do not change it merely for variety.',
      'If a field does not need changes, omit it from revisionPlan.',
    ],
});

const buildReviewInput = ({ context, draft }) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请审查下面这份塔罗初稿。',
      '保留好的部分，只对真正需要修正的地方（如逻辑断层、建议空泛、套话连篇）提出 revisionPlan。',
      '如果星辰低语、锚定语或反思提问已经足够贴合当前牌阵，就不要为了求新而改；如果它们过于通用，就明确指出。',
    ]
    : [
      'Review the tarot draft below.',
      'Preserve what is already strong and propose revisions only where they meaningfully improve the reading (e.g., fixing logical gaps, generic advice, or platitudes).',
      'Do not force novelty for its own sake, but explicitly flag quote, mantra, or follow-up prompts when they feel generic rather than spread-specific.',
    ],
  payload: {
    context,
    draft,
  },
});

export const runReviewAgent = async ({ context, draft, aiConfig }) => {
  const result = await runStructuredOpenAITask({
    aiConfig,
    schemaName: 'tarot_review_notes',
    schema: reviewReadingJsonSchema,
    instructions: buildReviewInstructions(context.language),
    input: buildReviewInput({ context, draft }),
    temperature: 0.3,
  });

  return {
    ...result,
    parsed: normalizeReviewPayload(result.parsed),
  };
};
