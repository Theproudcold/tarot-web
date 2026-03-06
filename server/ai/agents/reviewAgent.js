import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { reviewReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions, normalizeReviewPayload } from './shared.js';

const buildReviewInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演“三省”中的门下省复核官，负责审读初稿，指出优点、风险，并给出必要的修订方案。'
    : 'You are the Menxia Sheng review agent. Audit the draft, identify strengths and risks, and propose only the revisions that materially improve the reading.',
  contractLines: language === 'zh'
    ? [
      '不要重写整篇解读，只返回 strengths、risks、revisionPlan。',
      '重点检查：是否偏离牌义、是否过度断言、是否宿命化、是否建议空泛或互相矛盾。',
      '如果某个字段无需修改，可以在 revisionPlan 中省略它。',
    ]
    : [
      'Do not rewrite the entire reading; return only strengths, risks, and revisionPlan.',
      'Focus on card-evidence alignment, overclaiming, fatalistic language, contradictions, and vague advice.',
      'If a field does not need changes, omit it from revisionPlan.',
    ],
});

const buildReviewInput = ({ context, draft }) => buildAgentInput({
  introLines: context.language === 'zh'
    ? [
      '请审查下面这份塔罗初稿。',
      '保留好的部分，只对真正需要修正的地方提出 revisionPlan。',
    ]
    : [
      'Review the tarot draft below.',
      'Preserve what is already strong and propose revisions only where they meaningfully improve the reading.',
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
