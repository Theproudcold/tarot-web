const stripCodeFence = (value = '') => value
  .trim()
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/i, '')
  .trim();

const isWhitespace = (character) => /\s/.test(character);

const decodeEscape = (character) => {
  switch (character) {
    case '"':
      return '"';
    case '\\':
      return '\\';
    case '/':
      return '/';
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    default:
      return character;
  }
};

const createParser = (source) => ({
  source,
  index: 0,
});

const skipWhitespace = (parser) => {
  while (parser.index < parser.source.length && isWhitespace(parser.source[parser.index])) {
    parser.index += 1;
  }
};

const parsePartialString = (parser) => {
  if (parser.source[parser.index] !== '"') {
    return { value: undefined, complete: false };
  }

  parser.index += 1;
  let result = '';

  while (parser.index < parser.source.length) {
    const character = parser.source[parser.index];
    parser.index += 1;

    if (character === '"') {
      return { value: result, complete: true };
    }

    if (character === '\\') {
      if (parser.index >= parser.source.length) {
        return { value: result, complete: false };
      }

      const nextCharacter = parser.source[parser.index];
      parser.index += 1;

      if (nextCharacter === 'u') {
        const unicodeValue = parser.source.slice(parser.index, parser.index + 4);
        if (unicodeValue.length < 4 || /[^0-9a-f]/i.test(unicodeValue)) {
          return { value: result, complete: false };
        }
        result += String.fromCharCode(Number.parseInt(unicodeValue, 16));
        parser.index += 4;
        continue;
      }

      result += decodeEscape(nextCharacter);
      continue;
    }

    result += character;
  }

  return { value: result, complete: false };
};

const parseKeyword = (parser, keyword, value) => {
  if (parser.source.startsWith(keyword, parser.index)) {
    parser.index += keyword.length;
    return { value, complete: true };
  }

  const remaining = parser.source.slice(parser.index);
  if (keyword.startsWith(remaining)) {
    parser.index = parser.source.length;
    return { value, complete: false };
  }

  return { value: undefined, complete: false };
};

const parseNumber = (parser) => {
  const startIndex = parser.index;
  const characters = [];

  while (parser.index < parser.source.length) {
    const character = parser.source[parser.index];
    if (!/[0-9eE+\-.]/.test(character)) {
      break;
    }
    characters.push(character);
    parser.index += 1;
  }

  if (!characters.length) {
    return { value: undefined, complete: false };
  }

  const rawValue = characters.join('');
  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    parser.index = startIndex;
    return { value: undefined, complete: false };
  }

  return {
    value: parsedValue,
    complete: parser.index < parser.source.length,
  };
};

function parsePartialValue(parser) {
  skipWhitespace(parser);

  if (parser.index >= parser.source.length) {
    return { value: undefined, complete: false };
  }

  const character = parser.source[parser.index];

  if (character === '"') {
    return parsePartialString(parser);
  }

  if (character === '{') {
    return parsePartialObject(parser);
  }

  if (character === '[') {
    return parsePartialArray(parser);
  }

  if (character === 't') {
    return parseKeyword(parser, 'true', true);
  }

  if (character === 'f') {
    return parseKeyword(parser, 'false', false);
  }

  if (character === 'n') {
    return parseKeyword(parser, 'null', null);
  }

  return parseNumber(parser);
}

function parsePartialArray(parser) {
  if (parser.source[parser.index] !== '[') {
    return { value: undefined, complete: false };
  }

  parser.index += 1;
  const items = [];

  while (true) {
    skipWhitespace(parser);

    if (parser.index >= parser.source.length) {
      return { value: items, complete: false };
    }

    if (parser.source[parser.index] === ']') {
      parser.index += 1;
      return { value: items, complete: true };
    }

    const nextValue = parsePartialValue(parser);
    if (typeof nextValue.value !== 'undefined') {
      items.push(nextValue.value);
    }

    if (!nextValue.complete) {
      return { value: items, complete: false };
    }

    skipWhitespace(parser);

    if (parser.index >= parser.source.length) {
      return { value: items, complete: false };
    }

    if (parser.source[parser.index] === ',') {
      parser.index += 1;
      continue;
    }

    if (parser.source[parser.index] === ']') {
      parser.index += 1;
      return { value: items, complete: true };
    }

    return { value: items, complete: false };
  }
}

function parsePartialObject(parser) {
  if (parser.source[parser.index] !== '{') {
    return { value: undefined, complete: false };
  }

  parser.index += 1;
  const result = {};

  while (true) {
    skipWhitespace(parser);

    if (parser.index >= parser.source.length) {
      return { value: result, complete: false };
    }

    if (parser.source[parser.index] === '}') {
      parser.index += 1;
      return { value: result, complete: true };
    }

    const keyResult = parsePartialString(parser);
    if (typeof keyResult.value === 'undefined') {
      return { value: result, complete: false };
    }

    skipWhitespace(parser);

    if (parser.index >= parser.source.length || parser.source[parser.index] !== ':') {
      return { value: result, complete: false };
    }

    parser.index += 1;
    skipWhitespace(parser);

    const valueResult = parsePartialValue(parser);
    if (typeof valueResult.value !== 'undefined') {
      result[keyResult.value] = valueResult.value;
    }

    if (!valueResult.complete) {
      return { value: result, complete: false };
    }

    skipWhitespace(parser);

    if (parser.index >= parser.source.length) {
      return { value: result, complete: false };
    }

    if (parser.source[parser.index] === ',') {
      parser.index += 1;
      continue;
    }

    if (parser.source[parser.index] === '}') {
      parser.index += 1;
      return { value: result, complete: true };
    }

    return { value: result, complete: false };
  }
}

export const parsePartialJsonObject = (value = '') => {
  const normalized = stripCodeFence(value);
  const startIndex = normalized.indexOf('{');

  if (startIndex < 0) {
    return {};
  }

  const parser = createParser(normalized.slice(startIndex));
  const parsed = parsePartialObject(parser);

  return parsed.value && typeof parsed.value === 'object' && !Array.isArray(parsed.value)
    ? parsed.value
    : {};
};
