const elementLabels = {
  Fire: { en: 'Fire', zh: '火' },
  Water: { en: 'Water', zh: '水' },
  Air: { en: 'Air', zh: '风' },
  Earth: { en: 'Earth', zh: '土' },
};

const dominantDescriptions = {
  Fire: {
    en: 'Action, courage, momentum, and creative spark are leading the spread.',
    zh: '行动、勇气、推进力与创造火花，正在主导这组牌的走向。',
  },
  Water: {
    en: 'Emotion, intuition, and the inner world are shaping the current pattern.',
    zh: '情绪、直觉与内在世界，正在塑造你此刻的局势。',
  },
  Air: {
    en: 'Thought, perspective, and clarity are the strongest forces in this reading.',
    zh: '思考、视角与认知清晰度，是这次解读里最强的力量。',
  },
  Earth: {
    en: 'Practicality, grounding, and tangible progress are the key themes here.',
    zh: '现实、落地与可执行的进展，是这里最关键的主题。',
  },
};

const slotLabels = {
  past: { en: 'Past / Root', zh: '过去 / 根源' },
  present: { en: 'Present / Situation', zh: '现在 / 处境' },
  future: { en: 'Future / Trend', zh: '未来 / 趋向' },
};

const quotes = {
  zh: [
    '“命运不会替你决定方向，但会在转弯处点亮一盏灯。”',
    '“当你愿意诚实面对自己，牌面就会从象征变成路标。”',
    '“真正的答案往往不在远方，而在你已经感受到的那一瞬间。”',
    '“宇宙并不急于给出结局，它更在意你如何穿越过程。”',
  ],
  en: [
    '“Fate rarely chooses for you; it simply lights the turn ahead.”',
    '“When you face yourself honestly, symbols become signposts.”',
    '“The answer is often closer than it seems, already alive in your intuition.”',
    '“The universe is less concerned with endings than with how you move through change.”',
  ],
};

const adviceLibrary = {
  zh: [
    '把这次牌阵里最触动你的一句话写下来，连续观察三天。',
    '优先处理最能带来稳定感的一件小事，让能量先落地。',
    '留出十分钟安静独处，分辨“我真正想要的”与“我以为该做的”。',
    '如果情绪很满，先照顾身体节奏，再做重要决定。',
  ],
  en: [
    'Write down the line from this reading that stayed with you, then revisit it for three days.',
    'Start with one small action that creates stability before making larger choices.',
    'Set aside ten quiet minutes to separate what you truly want from what you feel expected to do.',
    'If emotions are intense, care for your physical rhythm before making a major decision.',
  ],
};

const followUpLibrary = {
  zh: [
    '如果你只前进一步，最值得先尝试的行动是什么？',
    '哪张牌最像你现在的真实状态？为什么？',
    '这组牌提醒你放下的模式，可能是什么？',
    '如果把未来那张牌当成方向，而不是结果，你会怎么行动？',
  ],
  en: [
    'If you could take only one next step, which action feels most aligned?',
    'Which card reflects your present truth most clearly, and why?',
    'What pattern might this spread be asking you to release?',
    'If you treat the future card as a direction instead of a fixed outcome, what changes?',
  ],
};

const mantras = {
  zh: [
    '“先回到自己，再决定方向。”',
    '“看清真实，温柔行动。”',
    '“答案在行动里，不只在想象里。”',
  ],
  en: [
    '“Return to yourself before choosing the road.”',
    '“See clearly, then move gently.”',
    '“The answer lives in action, not only in imagination.”',
  ],
};

const safetyNotes = {
  zh: '塔罗解读适合自我反思与情绪梳理，不替代医疗、法律、财务或心理危机支持。',
  en: 'Tarot is best used for reflection and emotional processing, not as a substitute for medical, legal, financial, or crisis support.',
};

const slotNarratives = {
  zh: {
    past: (title, meaning, orientationLabel) => `${title}${orientationLabel ? `（${orientationLabel}）` : ''}揭示了你一路带来的背景能量，核心主题是${meaning}。它说明过往经历仍在影响你今天的判断方式。`,
    present: (title, meaning, orientationLabel) => `${title}${orientationLabel ? `（${orientationLabel}）` : ''}显示你当前最需要面对的是${meaning}。这张牌提醒你，眼前的局势更需要觉察与选择，而不是惯性反应。`,
    future: (title, meaning, orientationLabel) => `${title}${orientationLabel ? `（${orientationLabel}）` : ''}让未来的趋势落在${meaning}上。它更像是一种正在形成的方向，提示你如何与接下来的变化合作。`,
  },
  en: {
    past: (title, meaning, orientationLabel) => `${title}${orientationLabel ? ` (${orientationLabel})` : ''} reveals the background energy you have been carrying, centered on ${meaning}. It shows how earlier experiences still shape the way you interpret the present.`,
    present: (title, meaning, orientationLabel) => `${title}${orientationLabel ? ` (${orientationLabel})` : ''} highlights ${meaning} as the core of your current situation. This card asks for awareness and choice rather than automatic reaction.`,
    future: (title, meaning, orientationLabel) => `${title}${orientationLabel ? ` (${orientationLabel})` : ''} places the emerging trend in the realm of ${meaning}. Treat it less as a fixed prediction and more as a direction that is beginning to form.`,
  },
};

export const readingSlots = ['past', 'present', 'future'];

export const getLocalized = (value, language = 'en') => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || '';
};

export const cleanMeaning = (text) => (text ? text.replace(/[。.,，\s]+$/, '') : '');

export const getCardMeaning = (card, language = 'en') => cleanMeaning(getLocalized(card?.isReversed ? card?.meaning_reversed : card?.meaning_upright, language));

export const getOrientation = (card) => (card?.isReversed ? 'reversed' : 'upright');

export const getOrientationLabel = (card, language = 'en') => (
  card?.isReversed
    ? language === 'zh' ? '逆位' : 'Reversed'
    : language === 'zh' ? '正位' : 'Upright'
);

export const serializeCards = (cards = []) => cards.map((card) => ({
  id: card.id,
  isReversed: Boolean(card.isReversed),
}));

const pickBySeed = (items, seed, offset = 0) => items[(seed + offset) % items.length];

export const computeElementDistribution = (cards = [], language = 'en') => {
  const counts = { Fire: 0, Water: 0, Air: 0, Earth: 0 };

  cards.forEach((card) => {
    if (card?.element && counts[card.element] !== undefined) {
      counts[card.element] += 1;
    }
  });

  const total = cards.length || 1;
  const distribution = Object.entries(counts).map(([key, count]) => ({
    key,
    label: getLocalized(elementLabels[key], language),
    count,
    percent: Math.round((count / total) * 100),
  }));

  const dominant = distribution.reduce((current, candidate) => (
    candidate.count > current.count ? candidate : current
  ), distribution[0]);

  return {
    distribution,
    dominantElement: {
      ...dominant,
      description: getLocalized(dominantDescriptions[dominant.key], language),
    },
  };
};

const buildSummary = ({ cards, language, question, dominantElement }) => {
  const [past, present, future] = cards;
  const pastMeaning = getCardMeaning(past, language);
  const presentMeaning = getCardMeaning(present, language);
  const futureMeaning = getCardMeaning(future, language);

  if (language === 'zh') {
    const questionLead = question ? `围绕“${question}”，` : '';
    return `${questionLead}这组牌显示，你正从${pastMeaning}的经验里走来，当前被${presentMeaning}所牵动，而未来的发展更接近${futureMeaning}。整体能量以${dominantElement.label}元素为主，说明当下最重要的，不是追求立刻确定答案，而是用更清醒的方式回应正在发生的变化。`;
  }

  const questionLead = question ? `Around the question of “${question},” ` : '';
  return `${questionLead}this spread shows a path moving from ${pastMeaning}, through the pressure or invitation of ${presentMeaning}, toward the emerging direction of ${futureMeaning}. With ${dominantElement.label.toLowerCase()} as the dominant element, the key is not forcing certainty too early, but responding to change with greater clarity and intention.`;
};

const buildPerCardReading = (slot, card, language = 'en') => {
  const title = getLocalized(card?.name, language);
  const orientationLabel = getOrientationLabel(card, language);
  const keyword = getCardMeaning(card, language);

  return {
    slot,
    slotLabel: getLocalized(slotLabels[slot], language),
    title,
    orientation: getOrientation(card),
    orientationLabel,
    keyword,
    message: slotNarratives[language][slot](title, keyword, orientationLabel),
  };
};

export const buildReadingSkeleton = (cards = [], options = {}) => {
  const {
    language = 'en',
    question = '',
    source = 'api',
    model = null,
    createdAt = new Date().toISOString(),
  } = options;

  if (cards.length < 3) return null;

  const elemental = computeElementDistribution(cards, language);

  return {
    version: '1.0',
    language,
    source,
    model,
    question,
    createdAt,
    summary: '',
    quote: '',
    dominantElement: elemental.dominantElement,
    elementDistribution: elemental.distribution,
    perCard: readingSlots.map((slot, index) => ({
      ...buildPerCardReading(slot, cards[index], language),
      message: '',
    })),
    advice: [],
    followUps: [],
    mantra: '',
    safetyNote: '',
  };
};

export const buildReading = (cards = [], options = {}) => {
  const {
    language = 'en',
    question = '',
    source = 'local-fallback',
    model = null,
    createdAt = new Date().toISOString(),
  } = options;

  if (cards.length < 3) return null;

  const seed = cards.reduce((total, card, index) => (
    total + (card.id + 17) * (index + 1) + (card.isReversed ? 11 : 0)
  ), 0);

  const elemental = computeElementDistribution(cards, language);

  return {
    version: '1.0',
    language,
    source,
    model,
    question,
    createdAt,
    summary: buildSummary({ cards, language, question, dominantElement: elemental.dominantElement }),
    quote: pickBySeed(quotes[language], seed),
    dominantElement: elemental.dominantElement,
    elementDistribution: elemental.distribution,
    perCard: readingSlots.map((slot, index) => buildPerCardReading(slot, cards[index], language)),
    advice: [
      pickBySeed(adviceLibrary[language], seed),
      pickBySeed(adviceLibrary[language], seed, 2),
    ],
    followUps: [
      pickBySeed(followUpLibrary[language], seed),
      pickBySeed(followUpLibrary[language], seed, 1),
      pickBySeed(followUpLibrary[language], seed, 2),
    ],
    mantra: pickBySeed(mantras[language], seed),
    safetyNote: safetyNotes[language],
  };
};
