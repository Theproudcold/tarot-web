import { aiReadingJsonSchema, mergeReadingWithBase } from '../../../src/lib/readingContract.js';
import { buildReading, computeElementDistribution, getCardMeaning, getLocalized, getOrientationLabel, readingSlots } from '../../../src/lib/tarotReading.js';
import { parsePartialJsonObject } from './partialJson.js';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const env = globalThis.process?.env ?? {};

const normalizeTimeout = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_PROVIDER_TIMEOUT_MS = normalizeTimeout(env.OPENAI_REQUEST_TIMEOUT_MS || env.AI_PROVIDER_TIMEOUT_MS, 90000);
const DEFAULT_PROVIDER_STREAM_TIMEOUT_MS = normalizeTimeout(env.OPENAI_STREAM_TIMEOUT_MS || env.OPENAI_REQUEST_TIMEOUT_MS || env.AI_PROVIDER_TIMEOUT_MS, 180000);

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

const createTimeoutState = (timeoutMs, timeoutLabel) => {
  const controller = new AbortController();
  let timeoutId = null;

  const reset = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  };

  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const wrapError = (error) => {
    if (error?.name === 'AbortError') {
      return new Error(`${timeoutLabel} timed out after ${timeoutMs}ms`);
    }

    return error;
  };

  reset();

  return {
    controller,
    timeoutMs,
    timeoutLabel,
    reset,
    clear,
    wrapError,
  };
};

const fetchWithTimeout = async (url, options, timeoutMs, timeoutLabel) => {
  const timeoutState = createTimeoutState(timeoutMs, timeoutLabel);

  try {
    const response = await fetch(url, {
      ...options,
      signal: timeoutState.controller.signal,
    });

    timeoutState.reset();

    return {
      response,
      timeoutState,
    };
  } catch (error) {
    timeoutState.clear();
    throw timeoutState.wrapError(error);
  }
};

const readResponseText = async (response, timeoutState) => {
  if (!response.body) {
    try {
      timeoutState?.reset();
      const text = await response.text();
      timeoutState?.clear();
      return text;
    } catch (error) {
      timeoutState?.clear();
      throw timeoutState?.wrapError ? timeoutState.wrapError(error) : error;
    }
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  try {
    while (true) {
      timeoutState?.reset();

      let chunkResult;
      try {
        chunkResult = await reader.read();
      } catch (error) {
        throw timeoutState?.wrapError ? timeoutState.wrapError(error) : error;
      }

      const { value, done } = chunkResult;
      if (done) {
        break;
      }

      if (value) {
        text += decoder.decode(value, { stream: true });
      }
    }

    text += decoder.decode();
    return text;
  } finally {
    timeoutState?.clear();

    try {
      reader.releaseLock();
    } catch {
      // noop
    }
  }
};

const readJsonResponse = async (response, timeoutState, fallbackMessage = 'Invalid JSON response') => {
  const text = await readResponseText(response, timeoutState);

  if (!text) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || fallbackMessage);
  }
};

const readErrorText = async (response, fallbackMessage, timeoutState) => {
  const errorText = await readResponseText(response, timeoutState);
  throw new Error(errorText || fallbackMessage);
};

const parseSseEventChunk = (rawChunk) => {
  const lines = rawChunk.split('\n');
  let event = 'message';
  const dataLines = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  });

  if (!dataLines.length) {
    return null;
  }

  return {
    event,
    rawData: dataLines.join('\n'),
  };
};

const consumeSseStream = async (stream, onEvent, timeoutState = null) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      timeoutState?.reset();

      let chunkResult;
      try {
        chunkResult = await reader.read();
      } catch (error) {
        throw timeoutState?.wrapError ? timeoutState.wrapError(error) : error;
      }

      const { value, done } = chunkResult;
      if (done) {
        break;
      }

      timeoutState?.reset();
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const parsed = parseSseEventChunk(chunk.trim());
        if (parsed) {
          await onEvent(parsed);
        }
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const parsed = parseSseEventChunk(trailing);
      if (parsed) {
        await onEvent(parsed);
      }
    }
  } finally {
    timeoutState?.clear();

    try {
      reader.releaseLock();
    } catch {
      // noop
    }
  }
};

const getStreamErrorMessage = (payload, fallbackMessage) => payload?.error?.message || payload?.message || payload?.detail || fallbackMessage;

const emitPartialStructuredObject = async ({ rawText, partialParser, onPartialObject, state, meta }) => {
  if (typeof onPartialObject !== 'function' || !rawText) {
    return;
  }

  const rawPartialObject = parsePartialJsonObject(rawText);
  const partialObject = typeof partialParser === 'function'
    ? partialParser(rawPartialObject, rawText)
    : rawPartialObject;

  if (!partialObject || typeof partialObject !== 'object' || !Object.keys(partialObject).length) {
    return;
  }

  const serialized = JSON.stringify(partialObject);
  if (serialized === state.lastSerialized) {
    return;
  }

  state.lastSerialized = serialized;
  await onPartialObject(partialObject, meta);
};

const requestResponsesStructuredTask = async ({ endpoint, apiKey, model, schemaName, schema, instructions, input }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
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
  }, DEFAULT_PROVIDER_TIMEOUT_MS, 'OpenAI request');

  if (!response.ok) {
    await readErrorText(response, `OpenAI request failed with status ${response.status}`, timeoutState);
  }

  return extractStructuredOutput(await readJsonResponse(response, timeoutState, 'OpenAI request returned an invalid JSON body'));
};

const requestResponsesStructuredTaskStream = async ({ endpoint, apiKey, model, schemaName, schema, instructions, input, partialParser, onPartialObject, meta }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
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
  }, DEFAULT_PROVIDER_STREAM_TIMEOUT_MS, 'OpenAI streaming request');

  if (!response.ok || !response.body) {
    await readErrorText(response, `OpenAI streaming request failed with status ${response.status}`, timeoutState);
  }

  const state = { rawText: '', lastSerialized: '' };
  let completedPayload = null;

  await consumeSseStream(response.body, async ({ event, rawData }) => {
    if (!rawData || rawData === '[DONE]') {
      return;
    }

    const payload = JSON.parse(rawData);
    const eventName = event === 'message' ? payload?.type || event : event;

    if (eventName === 'response.output_text.delta') {
      const delta = typeof payload?.delta === 'string' ? payload.delta : '';
      if (!delta) {
        return;
      }
      state.rawText += delta;
      await emitPartialStructuredObject({
        rawText: state.rawText,
        partialParser,
        onPartialObject,
        state,
        meta,
      });
      return;
    }

    if (eventName === 'response.output_text.done') {
      const text = typeof payload?.text === 'string' ? payload.text : '';
      if (text && text !== state.rawText) {
        state.rawText = text;
        await emitPartialStructuredObject({
          rawText: state.rawText,
          partialParser,
          onPartialObject,
          state,
          meta,
        });
      }
      return;
    }

    if (eventName === 'response.completed') {
      completedPayload = payload?.response || payload;
      return;
    }

    if (eventName === 'response.error' || eventName === 'response.failed' || eventName === 'error') {
      throw new Error(getStreamErrorMessage(payload, 'OpenAI streaming request failed'));
    }
  }, timeoutState);

  const parsed = extractJsonObject(state.rawText) || extractStructuredOutput(completedPayload);

  return {
    parsed,
    rawText: state.rawText,
  };
};

const requestChatCompletionsStructuredTask = async ({ endpoint, apiKey, model, instructions, input, temperature = 0.7 }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
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
  }, DEFAULT_PROVIDER_TIMEOUT_MS, 'OpenAI-compatible request');

  if (!response.ok) {
    await readErrorText(response, `OpenAI-compatible request failed with status ${response.status}`, timeoutState);
  }

  return extractChatStructuredOutput(await readJsonResponse(response, timeoutState, 'OpenAI-compatible request returned an invalid JSON body'));
};

const requestChatCompletionsStructuredTaskStream = async ({ endpoint, apiKey, model, instructions, input, temperature = 0.7, partialParser, onPartialObject, meta }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      stream: true,
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
  }, DEFAULT_PROVIDER_STREAM_TIMEOUT_MS, 'OpenAI-compatible streaming request');

  if (!response.ok || !response.body) {
    await readErrorText(response, `OpenAI-compatible streaming request failed with status ${response.status}`, timeoutState);
  }

  const state = { rawText: '', lastSerialized: '' };

  await consumeSseStream(response.body, async ({ rawData }) => {
    if (!rawData || rawData === '[DONE]') {
      return;
    }

    const payload = JSON.parse(rawData);

    if (payload?.error) {
      throw new Error(getStreamErrorMessage(payload, 'OpenAI-compatible streaming request failed'));
    }

    const delta = typeof payload?.choices?.[0]?.delta?.content === 'string'
      ? payload.choices[0].delta.content
      : extractChatContentText(payload?.choices?.[0]?.delta?.content);

    if (!delta) {
      return;
    }

    state.rawText += delta;
    await emitPartialStructuredObject({
      rawText: state.rawText,
      partialParser,
      onPartialObject,
      state,
      meta,
    });
  }, timeoutState);

  return {
    parsed: extractJsonObject(state.rawText),
    rawText: state.rawText,
  };
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

export const streamStructuredOpenAITask = async ({ aiConfig, schemaName, schema, instructions, input, temperature = 0.7, partialParser, onPartialObject }) => {
  const { apiKey, model, endpointConfig } = resolveOpenAIConfig(aiConfig);
  assertApiKey(apiKey);

  const meta = {
    model,
    source: endpointConfig.source,
    endpoint: endpointConfig.endpoint,
    mode: endpointConfig.mode,
  };

  const result = endpointConfig.mode === 'responses'
    ? await requestResponsesStructuredTaskStream({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
      schemaName,
      schema,
      instructions,
      input,
      partialParser,
      onPartialObject,
      meta,
    })
    : await requestChatCompletionsStructuredTaskStream({
      endpoint: endpointConfig.endpoint,
      apiKey,
      model,
      instructions,
      input,
      temperature,
      partialParser,
      onPartialObject,
      meta,
    });

  if (!result.parsed) {
    throw new Error('AI response did not include structured output');
  }

  return {
    parsed: result.parsed,
    rawText: result.rawText,
    ...meta,
  };
};

const requestResponsesConnection = async ({ endpoint, apiKey, model }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
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
  }, DEFAULT_PROVIDER_TIMEOUT_MS, 'OpenAI connection test');

  if (!response.ok) {
    await readErrorText(response, `OpenAI connection test failed with status ${response.status}`, timeoutState);
  }

  await readJsonResponse(response, timeoutState, 'OpenAI connection test returned an invalid JSON body');
};

const requestChatCompletionConnection = async ({ endpoint, apiKey, model }) => {
  const { response, timeoutState } = await fetchWithTimeout(endpoint, {
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
  }, DEFAULT_PROVIDER_TIMEOUT_MS, 'OpenAI-compatible connection test');

  if (!response.ok) {
    await readErrorText(response, `OpenAI-compatible connection test failed with status ${response.status}`, timeoutState);
  }

  await readJsonResponse(response, timeoutState, 'OpenAI-compatible connection test returned an invalid JSON body');
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
