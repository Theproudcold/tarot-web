/**
 * Few-shot 示例与反面对照模块
 * 为各 agent 提供风格锚定的参考片段，引导模型输出具备专业占卜师质感的解读。
 */

// ---------- 反面对照（Bad vs Good） ----------

const contrastExamples = {
  zh: {
    quote: {
      bad: '"相信自己，答案在你心里。"',
      good: '"从愚者的冲动走到圣杯二的连接，你真正要学的不是更勇敢，而是如何在不确定中仍然伸出手。"',
      reason: '好的星辰低语必须包含本次牌面的具体意象，让人一看就知道这段话只属于这次占卜。',
    },
    mantra: {
      bad: '"保持觉察，顺其自然。"',
      good: '"先看清连接里的不安，再决定要不要更进一步。"',
      reason: '好的锚定语从牌面关键词中提炼出具体的行动指向，而不是放之四海皆准的鸡汤。',
    },
    advice: {
      bad: '倾听内心的声音，找到真正的自己。',
      good: '今晚用十分钟写下：在这段关系里，你最怕失去的那个"连接感"具体长什么样？写完之后看看哪些部分是你能主动创造的。',
      reason: '好的建议锚定在牌面意象上，提供明确的时间、场景和行动步骤。',
    },
    followUp: {
      bad: '你真正想要的是什么？',
      good: '愚者让你还在重复哪种与"冲动"有关的反应模式——是在感觉不安全时先一步逃跑，还是假装无所谓？',
      reason: '好的追问从牌面提取情绪锚点，直指具体的行为模式而非空泛的自我追问。',
    },
  },
  en: {
    quote: {
      bad: '"Trust yourself; the answer is within you."',
      good: '"From The Fool\'s leap into the Two of Cups\' connection, the real lesson is not about courage—it is about reaching out while still uncertain."',
      reason: 'A good quote must contain specific imagery from this spread so the reader knows it was written for this exact reading.',
    },
    mantra: {
      bad: '"Stay aware and go with the flow."',
      good: '"Name the unease inside the connection, then decide how far to move."',
      reason: 'A good mantra extracts a specific action direction from the card keywords instead of a universal platitude.',
    },
    advice: {
      bad: 'Listen to your inner voice and find your true self.',
      good: 'Tonight, spend ten minutes writing down what the "connection" you fear losing actually looks like. After writing, notice which parts you can actively create.',
      reason: 'Good advice anchors on card imagery and provides a clear time, setting, and action step.',
    },
    followUp: {
      bad: 'What do you really want?',
      good: 'What reaction tied to "impulsiveness" are you still repeating because of The Fool—running first when things feel unsafe, or pretending you do not care?',
      reason: 'A good follow-up extracts emotional anchors from the cards and targets specific behavioral patterns.',
    },
  },
};

// ---------- 风格示例片段（单张牌叙事） ----------

const narrativeExample = {
  zh: {
    slot: 'present',
    cardName: '圣杯二',
    orientation: '正位',
    message: '圣杯二（正位）让"连接"成为你此刻最核心的议题。这不仅是两个人之间的事——它更像在问你：当你伸出手的时候，你期待的是对等的回应，还是单纯需要确认自己值得被接住？水元素在此处涌动，说明情绪正在替你做大部分决策。在做出下一步之前，先分辨清楚：你感受到的"渴望连接"，有多少是出于真正的情感需要，又有多少是出于害怕独处。',
  },
  en: {
    slot: 'present',
    cardName: 'Two of Cups',
    orientation: 'Upright',
    message: 'The Two of Cups (Upright) places "connection" at the center of your current situation. This is not just about another person—it is asking whether, when you reach out, you expect an equal response or simply need confirmation that you are worth catching. Water surges here, meaning emotions are making most of your decisions. Before your next move, distinguish how much of your longing for connection comes from genuine emotional need and how much comes from a fear of being alone.',
  },
};

// ---------- 公共构建函数 ----------

/**
 * 构建反面对照文本块，用于拼入 system prompt
 * @param {string} language - 'zh' | 'en'
 * @returns {string} 格式化后的对照示例文本
 */
export const buildContrastBlock = (language) => {
  const examples = contrastExamples[language] || contrastExamples.en;

  if (language === 'zh') {
    return [
      '【输出质量对照 — 看清"不合格"与"合格"的区别】',
      '',
      `星辰低语（quote）：`,
      `  ✗ 不合格：${examples.quote.bad}`,
      `  ✓ 合格：${examples.quote.good}`,
      `  → ${examples.quote.reason}`,
      '',
      `锚定语（mantra）：`,
      `  ✗ 不合格：${examples.mantra.bad}`,
      `  ✓ 合格：${examples.mantra.good}`,
      `  → ${examples.mantra.reason}`,
      '',
      `行动建议（advice）：`,
      `  ✗ 不合格：${examples.advice.bad}`,
      `  ✓ 合格：${examples.advice.good}`,
      `  → ${examples.advice.reason}`,
      '',
      `反思追问（followUp）：`,
      `  ✗ 不合格：${examples.followUp.bad}`,
      `  ✓ 合格：${examples.followUp.good}`,
      `  → ${examples.followUp.reason}`,
    ].join('\n');
  }

  return [
    '【Output Quality Contrast — See the difference between unacceptable and acceptable output】',
    '',
    `Quote:`,
    `  ✗ Unacceptable: ${examples.quote.bad}`,
    `  ✓ Acceptable: ${examples.quote.good}`,
    `  → ${examples.quote.reason}`,
    '',
    `Mantra:`,
    `  ✗ Unacceptable: ${examples.mantra.bad}`,
    `  ✓ Acceptable: ${examples.mantra.good}`,
    `  → ${examples.mantra.reason}`,
    '',
    `Advice:`,
    `  ✗ Unacceptable: ${examples.advice.bad}`,
    `  ✓ Acceptable: ${examples.advice.good}`,
    `  → ${examples.advice.reason}`,
    '',
    `Follow-up question:`,
    `  ✗ Unacceptable: ${examples.followUp.bad}`,
    `  ✓ Acceptable: ${examples.followUp.good}`,
    `  → ${examples.followUp.reason}`,
  ].join('\n');
};

/**
 * 构建叙事风格示例，用于展示单张牌解读的期望风格
 * @param {string} language - 'zh' | 'en'
 * @returns {string} 格式化后的风格示例文本
 */
export const buildNarrativeExample = (language) => {
  const example = narrativeExample[language] || narrativeExample.en;

  if (language === 'zh') {
    return [
      '【风格参考 — 单张牌解读示例】',
      `位置：${example.slot}，牌面：${example.cardName}（${example.orientation}）`,
      example.message,
      '注意这段文字如何做到：1）从牌面意象切入 2）连接到提问者的内在动机 3）提出具体的觉察方向 4）保持温和但不回避尖锐处。',
    ].join('\n');
  }

  return [
    '【Style Reference — Single card interpretation example】',
    `Position: ${example.slot}, Card: ${example.cardName} (${example.orientation})`,
    example.message,
    'Notice how this passage: 1) leads with card imagery 2) connects to the querent\'s internal motivation 3) offers a specific awareness direction 4) stays gentle without avoiding sharp truths.',
  ].join('\n');
};

/**
 * 构建完整的 few-shot 参考块（对照 + 风格示例）
 * @param {string} language - 'zh' | 'en'
 * @returns {string} 完整的 few-shot 文本段
 */
export const buildFewShotBlock = (language) => [
  buildContrastBlock(language),
  '',
  buildNarrativeExample(language),
].join('\n');
