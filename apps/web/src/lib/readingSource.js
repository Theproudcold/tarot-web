export const readingSourceLabels = {
  en: {
    openai: 'AI Reading',
    'custom-openai': 'Custom AI',
    'mock-server': 'Server Mock',
    'local-fallback': 'Local Fallback',
  },
  zh: {
    openai: 'AI 解读',
    'custom-openai': '自定义 AI',
    'mock-server': '服务端模拟',
    'local-fallback': '本地回退',
  },
};

const OFFICIAL_OPENAI_BASE_URL_PATTERN = /^https?:\/\/api\.openai\.com(?:\/|$)/i;

export const normalizeReadingSourceKey = (value) => {
  if (!value) return null;
  return value === 'mock' ? 'mock-server' : value;
};

export const resolveReadingSourceKey = ({ readingSource = null, runtimeProvider = null, settings = null } = {}) => {
  const normalizedReadingSource = normalizeReadingSourceKey(readingSource);
  if (normalizedReadingSource) {
    return normalizedReadingSource;
  }

  const apiBaseUrl = typeof settings?.apiBaseUrl === 'string' ? settings.apiBaseUrl.trim() : '';
  const apiKey = typeof settings?.apiKey === 'string' ? settings.apiKey.trim() : '';
  const model = typeof settings?.model === 'string' ? settings.model.trim() : '';
  const hasCustomProviderConfig = Boolean(settings?.enabled && (apiBaseUrl || apiKey || model));

  if (hasCustomProviderConfig) {
    if (apiBaseUrl && !OFFICIAL_OPENAI_BASE_URL_PATTERN.test(apiBaseUrl)) {
      return 'custom-openai';
    }
    return 'openai';
  }

  return normalizeReadingSourceKey(runtimeProvider);
};

export const getReadingSourceLabel = (source, language = 'en', providerLabel = '') => {
  const customLabel = typeof providerLabel === 'string' ? providerLabel.trim() : '';
  if (customLabel && source !== 'mock-server' && source !== 'local-fallback') {
    return customLabel;
  }

  const labels = readingSourceLabels[language] || readingSourceLabels.en;
  return labels[source] || labels['local-fallback'];
};
