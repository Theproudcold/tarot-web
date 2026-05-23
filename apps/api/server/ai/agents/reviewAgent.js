import { runStructuredOpenAITask } from '../providers/openaiProvider.js';
import { reviewReadingJsonSchema } from './agentSchemas.js';
import { buildAgentInput, buildAgentInstructions, normalizeReviewPayload } from './shared.js';

const buildReviewInstructions = (language) => buildAgentInstructions({
  language,
  roleLine: language === 'zh'
    ? '你现在扮演"解读复核"代理，负责审读初稿，指出优点、风险，并给出必要的修订方案。'
    : 'You are the reading-review agent. Audit the draft, identify strengths and risks, and propose only the revisions that materially improve the reading.',
  reasoningGuidance: language === 'zh'
    ? [
      '【审查维度】对初稿逐字段打分（内部评估，不输出分数，用于指导 revisionPlan 决策）：',
      '1. 叙事连贯性：perCard 三张牌之间是否有因果演进关系？读起来是"一个故事"还是"三段独立解释"？',
      '2. 牌面锚定度：每个字段是否包含本次牌面的具体意象或关键词？做"可替换性测试"——如果换到另一个牌阵依然成立，则标记为 risk。',
      '3. 行动可执行性：advice 是否具体到一个人今天就能做的事情？还是只是情绪上的安慰？',
      '4. 反套话检测：quote、mantra、followUps 中是否存在"答案在你心里""顺其自然""相信自己"等模板句？',
    ].join('\n')
    : [
      '【Audit Dimensions】Score the draft field by field internally (do not output scores; use them to guide revisionPlan decisions):',
      '1. Narrative cohesion: Do the three perCard entries form a causal progression? Does it read as "one story" or "three separate interpretations"?',
      '2. Spread anchoring: Does each field contain specific imagery or keywords from this spread? Apply the "substitutability test"—if a passage would still work in any other spread, flag it as a risk.',
      '3. Action specificity: Is each advice item concrete enough for someone to act on today? Or is it just emotional comfort?',
      '4. Anti-platitude scan: Do quote, mantra, or followUps contain template sentences like "the answer is within you," "go with the flow," or "trust yourself"?',
    ].join('\n'),
  contractLines: language === 'zh'
    ? [
      '不要重写整篇解读，只返回 strengths、risks、revisionPlan。',
      '只有当问题会明显损害准确性、独特性、可执行性或安全性时，才写入 revisionPlan。',
      '重点检查：时间脉络是否连贯、是否偏离牌义、是否过度断言、是否宿命化、advice/followUps 是否存在层级且不空泛。',
      '特别检查 quote、mantra、followUps 是否像模板句；如果是，必须在 risks 中指出，并在 revisionPlan 中重写相关字段使其更加锋利。',
      '对每个字段执行"可替换性测试"：如果一段文字换到另一个牌阵依然成立，就标记为 risk 并在 revisionPlan 中提供更锚定当前牌阵的替代版本。',
      '如果为了显得"贴合牌阵"而机械堆砌牌名、关键词或教科书术语，也要视为风险，因为这会稀释神秘感与自然表达。',
      '如果某个字段已经足够贴合当前牌阵，不要为了"变化"而强行改写。',
      '如果某个字段无需修改，可以在 revisionPlan 中省略它。',
    ]
    : [
      'Do not rewrite the entire reading; return only strengths, risks, and revisionPlan.',
      'Only add something to revisionPlan when it materially harms accuracy, distinctiveness, actionability, or safety.',
      'Focus on timeline cohesiveness, card-evidence alignment, overclaiming, fatalistic language, and whether advice/followUps are layered.',
      'Specifically audit quote, mantra, and followUps for generic template language; if found, call it out in risks and rewrite that field in revisionPlan to be sharper.',
      'Apply the "substitutability test" to every field: if a passage would still work in any other spread, flag it as a risk and provide a more spread-anchored alternative in revisionPlan.',
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
      '对每个字段做"可替换性测试"——如果这段文字换到别的牌阵一样成立，就在 risks 中标记并在 revisionPlan 中重写。',
    ]
    : [
      'Review the tarot draft below.',
      'Preserve what is already strong and propose revisions only where they meaningfully improve the reading (e.g., fixing logical gaps, generic advice, or platitudes).',
      'Do not force novelty for its own sake, but explicitly flag quote, mantra, or follow-up prompts when they feel generic rather than spread-specific.',
      'Apply the "substitutability test" to each field—if a passage would work in any other spread, flag it in risks and rewrite in revisionPlan.',
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
