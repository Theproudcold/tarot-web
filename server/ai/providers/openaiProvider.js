import { aiReadingJsonSchema, mergeReadingWithBase } from '../../../src/lib/readingContract.js';
import { buildReading, computeElementDistribution, getCardMeaning, getLocalized, getOrientationLabel, readingSlots } from '../../../src/lib/tarotReading.js';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const env = globalThis.process?.env ?? {};

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const isOfficialOpenAIBaseUrl = (value = '') => /^https?:\/\/api\.openai\.com(?:\/|$)/i.test(value);

export const buildCardContext = (cards, language) => readingSlots.map((slot, index) => {
  const card = cards[index];
  return {
    slot,
    cardName: getLocalized(card.name, language),
    orientation: getOrientationLabel(card, language),
    element: card.element,
    meaning: getCardMeaning(card, language),
  };
});

export const buildGroundedInstructions = (language) => {
  if (language === 'zh') {
    return '你是一个谨慎、温和、擅长结构化表达的塔罗解读助手。只基于提供的牌义与问题进行反思式分析，不做宿命论、医疗、法律、财务判断，不夸大确定性。';
  }

  return 'You are a careful, grounded tarot interpretation assistant. Base the reading only on the supplied card meanings and the user question. Avoid fatalism and avoid medical, legal, or financial guidance.';
};

export const buildJsonContract = (language, extraLines = []) => {
  const baseLines = language === 'zh'
    ? ['你必须只返回一个 JSON 对象，不要输出 Markdown、解释或额外文字。']
    : ['Return only a single JSON object with no markdown, code fences, or extra commentary.'];

  return [...baseLines, ...extraLines].join(' ');
};

const buildSingleAgentInput = ({ cards, language, question, previousReading }) => {
  const elemental = computeElementDistribution(cards, language);
  const context = {
    language,
    question: question || null,
    dominantElement: elemental.dominantElement,
    elementDistribution: elemental.distribution,
    cards: buildCardContext(cards, language),
    previousReading: previousReading ? {
      summary: previousReading.summary,
      advice: previousReading.advice,
    } : null,
  };

  if (language === 'zh') {
    return [
      '请基于以下 JSON 数据生成一次三张牌解读。',
      '语气保持温和、具体、可反思，并确保 perCard 中每个 slot 只生成一段新的解读 message。',
      buildJsonContract(language, [
        '必须包含这些字段：summary、quote、perCard、advice、followUps、mantra、safetyNote。',
        'perCard 必须包含 3 项，且每项都要有 slot 和 message，其中 slot 只能是 past、present、future。',
        'advice 返回 2 到 3 条字符串，followUps 返回 2 到 4 条字符串。',
      ]),
      '',
      JSON.stringify(context, null, 2),
    ].join('\n');
  }

  return [
    'Create a three-card tarot interpretation from the JSON below.',
    'Keep the tone reflective, specific, and grounded, and generate one fresh message per slot inside perCard.',
    buildJsonContract(language, [
      'Include these exact fields: summary, quote, perCard, advice, followUps, mantra, safetyNote.',
      'perCard must contain exactly 3 items and each item must include slot and message, where slot is one of past, present, future.',
      'advice must contain 2 to 3 strings, and followUps must contain 2 to 4 strings.',
    ]),
    '',
    JSON.stringify(context, null, 2),
  ].join('\n');
};

const extractJsonObject = (value = '') => {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const candidates = [withoutFence];
  const startIndex = withoutFence.indexOf('{');
  const endIndex = withoutFence.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    candidates.push(withoutFence.slice(startIndex, endIndex + 1));
  }

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
};

const extractStructuredOutput = (responseBody) => {
  if (!responseBody || typeof responseBody !== 'object') return null;

  for (const item of responseBody.output || []) {
    for (const content of item.content || []) {
      if (content && typeof content.parsed === 'object') {
        return content.parsed;
      }

      if (content && typeof content.text === 'string') {
        const parsed = extractJsonObject(content.text);
        if (parsed) return parsed;
      }
    }
  }

  if (typeof responseBody.output_text === 'string') {
    return extractJsonObject(responseBody.output_text);
  }

  return null;
};

const extractChatContentText = (content) => {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => {
      if (typeof item?.text === 'string') return item.text;
      if (typeof item?.content === 'string') return item.content;
      return '';
    })
    .filter(Boolean)
    .join('\n');
};

const extractChatStructuredOutput = (responseBody) => {
  const message = responseBody?.choices?.[0]?.message;
  if (!message) return null;
  return extractJsonObject(extractChatContentText(message.content));
};

const resolveEndpointConfig = (overrideBaseUrl) => {
  const baseUrl = trimTrailingSlash(overrideBaseUrl || env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL);
  const official = isOfficialOpenAIBaseUrl(baseUrl);

  if (baseUrl.endsWith('/responses')) {
    return { endpoint: baseUrl, mode: 'responses', source: official ? 'openai' : 'custom-openai' };
  }

  if (baseUrl.endsWith('/chat/completions')) {
    return { endpoint: baseUrl, mode: 'chat-completions', source: official ? 'openai' : 'custom-openai' };
  }

  if (official) {
    return { endpoint: `${baseUrl}/responses`, mode: 'responses', source: 'openai' };
  }

  return { endpoint: `${baseUrl}/chat/completions`, mode: 'chat-completions', source: 'custom-openai' };
};

export const resolveOpenAIConfig = (aiConfig) => ({
  apiKey: aiConfig?.apiKey || env.OPENAI_API_KEY,
  model: aiConfig?.model || env.OPENAI_MODEL || 'gpt-5-mini',
  endpointConfig: resolveEndpointConfig(aiConfig?.apiBaseUrl),
});

const assertApiKey = (apiKey) => {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
};

const readErrorText = async (response, fallbackMessage) => {
  const errorText = await response.text();
  throw new Error(errorText || fallbackMessage);
};

const requestResponsesStructuredTask = async ({ endpoint, apiKey, model, schemaName, schema, instructions, input }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    await readErrorText(response, `OpenAI request failed with status ${response.status}`);
  }

  return extractStructuredOutput(await response.json());
};

const requestChatCompletionsStructuredTask = async ({ endpoint, apiKey, model, instructions, input, temperature = 0.7 }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        {
          role: 'system',
          content: instructions,
        },
        {
          role: 'user',
          content: input,
        },
      ],
    }),
  });

  if (!response.ok) {
    await readErrorText(response, `OpenAI-compatible request failed with status ${response.status}`);
  }

  return extractChatStructuredOutput(await response.json());
};

export const runStructuredOpenAITask = async ({ aiConfig, schemaName, schema, instructions, input, temperature = 0.7 }) => {
  const { apiKey, model, endpointConfig } = resolveOpenAIConfig(aiConfig);
  assertApiKey(apiKey);

  const parsed = endpointConfig.mode === 'responses'
    ? await requestResponsesStructuredTask({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
      schemaName,
      schema,
      instructions,
      input,
    })
    : await requestChatCompletionsStructuredTask({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
      instructions,
      input,
      temperature,
    });

  if (!parsed) {
    throw new Error('AI response did not include structured output');
  }

  return {
    parsed,
    model,
    source: endpointConfig.source,
    endpoint: endpointConfig.endpoint,
    mode: endpointConfig.mode,
  };
};

const requestResponsesConnection = async ({ endpoint, apiKey, model }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: 'Reply with OK.',
      max_output_tokens: 12,
    }),
  });

  if (!response.ok) {
    await readErrorText(response, `OpenAI connection test failed with status ${response.status}`);
  }

  await response.json();
};

const requestChatCompletionConnection = async ({ endpoint, apiKey, model }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 8,
      messages: [
        {
          role: 'user',
          content: 'Reply with OK.',
        },
      ],
    }),
  });

  if (!response.ok) {
    await readErrorText(response, `OpenAI-compatible connection test failed with status ${response.status}`);
  }

  await response.json();
};

export const testOpenAIConnection = async ({ aiConfig } = {}) => {
  const { apiKey, model, endpointConfig } = resolveOpenAIConfig(aiConfig);
  assertApiKey(apiKey);

  if (endpointConfig.mode === 'responses') {
    await requestResponsesConnection({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
    });
  } else {
    await requestChatCompletionConnection({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
    });
  }

  return {
    ok: true,
    status: 'ok',
    provider: endpointConfig.source,
    model,
    mode: endpointConfig.mode,
    endpoint: endpointConfig.endpoint,
  };
};

export const createOpenAIReading = async ({ cards, language, question, createdAt, previousReading, aiConfig }) => {
  const { parsed, model, source } = await runStructuredOpenAITask({
    aiConfig,
    schemaName: 'tarot_reading',
    schema: aiReadingJsonSchema,
    instructions: buildGroundedInstructions(language),
    input: buildSingleAgentInput({ cards, language, question, previousReading }),
  });

  const baseReading = buildReading(cards, {
    language,
    question,
    createdAt,
    source,
    model,
  });

  return {
    reading: mergeReadingWithBase(baseReading, parsed, {
      source,
      model,
      question,
      createdAt,
      orchestration: 'single',
      agentPipeline: ['interpreter'],
    }),
  };
};
