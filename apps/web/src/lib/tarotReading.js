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

const quoteBuilders = {
  zh: [
    ({ past, present, future }) => `“从${past.title}的${past.keyword}走到${present.title}的${present.keyword}，你真正要学的是如何回应${future.title}带来的${future.keyword}。”`,
    ({ present, question }) => question
      ? `“围绕${question}，${present.title}提醒你先辨认${present.keyword}，再决定要不要更进一步。”`
      : `“${present.title}提醒你：先辨认${present.keyword}，再决定要不要更进一步。”`,
    ({ past, future }) => `“当${past.title}留下的${past.keyword}仍在回响时，${future.title}正在把方向推向${future.keyword}。”`,
    ({ dominantElement, present }) => `“${dominantElement.label}元素的力量，不是催你着急，而是要你更诚实地面对${present.keyword}。”`,
    ({ past, future }) => `“放下${past.keyword}里的旧反应，才有空间接住${future.title}所带来的新趋势。”`,
  ],
  en: [
    ({ past, present, future }) => `“From ${past.title}'s ${past.keyword} into ${present.title}'s ${present.keyword}, your real lesson is how to answer the ${future.keyword} carried by ${future.title}.”`,
    ({ present, question }) => question
      ? `“Around ${question}, ${present.title} asks you to name ${present.keyword} clearly before deciding how far to move.”`
      : `“${present.title} asks you to name ${present.keyword} clearly before deciding how far to move.”`,
    ({ past, future }) => `“While ${past.title} keeps echoing with ${past.keyword}, ${future.title} is already turning the path toward ${future.keyword}.”`,
    ({ dominantElement, present }) => `“The pull of ${dominantElement.label.toLowerCase()} is not asking for haste; it is asking for honesty about ${present.keyword}.”`,
    ({ past, future }) => `“Release the old reflex inside ${past.keyword}, and you make room for the direction forming through ${future.title}.”`,
  ],
};

const mantraBuilders = {
  zh: [
    ({ present }) => `“先看清${present.keyword}，再决定下一步。”`,
    ({ future }) => `“稳住自己，回应${future.keyword}。”`,
    ({ dominantElement, past }) => `“让${dominantElement.label}落地，不再被${past.keyword}牵着走。”`,
    ({ present, future }) => `“把${present.keyword}说清，也把${future.keyword}看清。”`,
    ({ future }) => `“朝着${future.keyword}的方向，慢一步也算前进。”`,
  ],
  en: [
    ({ present }) => `“Name ${present.keyword}, then choose the next step.”`,
    ({ future }) => `“Steady yourself and answer ${future.keyword}.”`,
    ({ dominantElement, past }) => `“Ground ${dominantElement.label.toLowerCase()} and stop moving from ${past.keyword} alone.”`,
    ({ present, future }) => `“Clarify ${present.keyword}, and make room for ${future.keyword}.”`,
    ({ future }) => `“Move toward ${future.keyword}, even if the pace is slow.”`,
  ],
};

const followUpBuilders = {
  zh: {
    past: [
      ({ past }) => `过去位的${past.title}，让你还在重复哪种与“${past.keyword}”有关的反应？`,
      ({ past }) => `如果把${past.title}看成根源提醒，哪段关于“${past.keyword}”的旧经验最该被重新理解？`,
      ({ past, present }) => `过去位的${past.keyword}，现在是怎样影响你面对${present.title}时的判断？`,
    ],
    present: [
      ({ present }) => `现在位的${present.title}提醒你，眼下最该正视的“${present.keyword}”是什么？`,
      ({ present, question }) => question
        ? `围绕${question}，${present.title}最想让你暂停确认的“${present.keyword}”是什么？`
        : `此刻的${present.title}，最想让你暂停确认的“${present.keyword}”是什么？`,
      ({ present, dominantElement }) => `${present.title}与${dominantElement.label}元素一起出现时，你最需要如何把“${present.keyword}”落到现实里？`,
    ],
    future: [
      ({ future }) => `如果未来位的${future.title}不是结果而是趋势，你今天能做什么来回应“${future.keyword}”？`,
      ({ future, question }) => question
        ? `面对${question}，${future.title}所指向的“${future.keyword}”更像提醒你提前准备什么？`
        : `${future.title}所指向的“${future.keyword}”，更像提醒你提前准备什么？`,
      ({ future, past }) => `为了不再被${past.keyword}拉回旧轨道，你可以如何迎向${future.title}带来的“${future.keyword}”？`,
    ],
  },
  en: {
    past: [
      ({ past }) => `What reaction tied to “${past.keyword}” are you still repeating because of ${past.title} in the past position?`,
      ({ past }) => `If ${past.title} is a root reminder, which old experience around “${past.keyword}” needs a new interpretation?`,
      ({ past, present }) => `How is the ${past.keyword} in your past still shaping the way you respond to ${present.title} now?`,
    ],
    present: [
      ({ present }) => `What part of “${present.keyword}” most needs your honest attention in ${present.title} right now?`,
      ({ present, question }) => question
        ? `Around ${question}, what does ${present.title} want you to pause and name inside “${present.keyword}”?`
        : `What does ${present.title} want you to pause and name inside “${present.keyword}”?`,
      ({ present, dominantElement }) => `With ${present.title} appearing alongside ${dominantElement.label.toLowerCase()}, how can you ground “${present.keyword}” in real action?`,
    ],
    future: [
      ({ future }) => `If ${future.title} is a direction rather than a verdict, what can you do today to answer “${future.keyword}”?`,
      ({ future, question }) => question
        ? `In relation to ${question}, what preparation does ${future.title} ask for through “${future.keyword}”?`
        : `What preparation does ${future.title} ask for through “${future.keyword}”?`,
      ({ future, past }) => `What would help you meet the “${future.keyword}” of ${future.title} without slipping back into ${past.keyword}?`,
    ],
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

const normalizePromptQuestion = (question = '', language = 'en') => {
  const trimmed = typeof question === 'string' ? question.trim() : '';
  if (!trimmed) {
    return '';
  }

  return language === 'zh'
    ? `“${trimmed.replace(/[。！？!?]+$/u, '')}”`
    : `“${trimmed.replace(/[.?!]+$/u, '')}”`;
};

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

const buildReflectionContext = ({ cards, language, question, dominantElement }) => {
  const [past, present, future] = cards.map((card, index) => buildPerCardReading(readingSlots[index], card, language));

  return {
    past,
    present,
    future,
    dominantElement,
    question: normalizePromptQuestion(question, language),
  };
};

const buildQuote = ({ language, seed, reflectionContext }) => {
  const builder = pickBySeed(quoteBuilders[language], seed);
  return builder(reflectionContext);
};

const buildMantra = ({ language, seed, reflectionContext }) => {
  const builder = pickBySeed(mantraBuilders[language], seed, 1);
  return builder(reflectionContext);
};

const buildFollowUps = ({ language, seed, reflectionContext }) => [
  pickBySeed(followUpBuilders[language].past, seed)(reflectionContext),
  pickBySeed(followUpBuilders[language].present, seed, 1)(reflectionContext),
  pickBySeed(followUpBuilders[language].future, seed, 2)(reflectionContext),
];

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
  const reflectionContext = buildReflectionContext({
    cards,
    language,
    question,
    dominantElement: elemental.dominantElement,
  });

  return {
    version: '1.0',
    language,
    source,
    model,
    question,
    createdAt,
    summary: buildSummary({ cards, language, question, dominantElement: elemental.dominantElement }),
    quote: buildQuote({ language, seed, reflectionContext }),
    dominantElement: elemental.dominantElement,
    elementDistribution: elemental.distribution,
    perCard: readingSlots.map((slot, index) => buildPerCardReading(slot, cards[index], language)),
    advice: [
      pickBySeed(adviceLibrary[language], seed),
      pickBySeed(adviceLibrary[language], seed, 2),
    ],
    followUps: buildFollowUps({ language, seed, reflectionContext }),
    mantra: buildMantra({ language, seed, reflectionContext }),
    safetyNote: safetyNotes[language],
  };
};
