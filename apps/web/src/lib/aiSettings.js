const STORAGE_KEY = 'tarot_ai_settings';

const isBrowser = typeof window !== 'undefined';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeOrchestrationMode = (value) => (value === 'single' || value === 'multi' ? value : '');

export const normalizeAiSettings = (settings = {}) => ({
  enabled: Boolean(settings.enabled),
  apiBaseUrl: normalizeText(settings.apiBaseUrl),
  apiKey: normalizeText(settings.apiKey),
  model: normalizeText(settings.model),
  providerLabel: normalizeText(settings.providerLabel),
  orchestrationMode: normalizeOrchestrationMode(settings.orchestrationMode),
});

export const hasCustomAiSettings = (settings = {}) => {
  const normalized = normalizeAiSettings(settings);
  return normalized.enabled && Boolean(normalized.apiBaseUrl || normalized.apiKey || normalized.model);
};

export const hasAiOverrides = (settings = {}) => {
  const normalized = normalizeAiSettings(settings);
  return hasCustomAiSettings(normalized) || Boolean(normalized.orchestrationMode);
};

export const serializeAiSettings = (settings = {}) => {
  const normalized = normalizeAiSettings(settings);

  if (!hasCustomAiSettings(normalized)) {
    return null;
  }

  return {
    ...(normalized.apiBaseUrl ? { apiBaseUrl: normalized.apiBaseUrl } : {}),
    ...(normalized.apiKey ? { apiKey: normalized.apiKey } : {}),
    ...(normalized.model ? { model: normalized.model } : {}),
  };
};

export const serializeOrchestrationMode = (settings = {}) => {
  const normalized = normalizeAiSettings(settings);
  return normalized.orchestrationMode || null;
};

export const loadAiSettings = () => {
  if (!isBrowser) {
    return normalizeAiSettings();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return normalizeAiSettings();
  }

  try {
    return normalizeAiSettings(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to parse AI settings', error);
    return normalizeAiSettings();
  }
};

export const saveAiSettings = (settings = {}) => {
  if (!isBrowser) return normalizeAiSettings(settings);

  const normalized = normalizeAiSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};
