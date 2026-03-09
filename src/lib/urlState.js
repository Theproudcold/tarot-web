export const URL_VIEW_PARAM = 'view';
export const URL_CARD_PARAM = 'card';
export const URL_LANGUAGE_PARAM = 'lang';

const VALID_VIEW_MODES = new Set(['reading', 'gallery', 'history']);
const VALID_LANGUAGES = new Set(['en', 'zh']);

const getUrl = (href) => {
  if (href) {
    return new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  }

  if (typeof window !== 'undefined') {
    return new URL(window.location.href);
  }

  return new URL('http://localhost/');
};

const normalizeLanguage = (language, fallback = 'zh') => (
  VALID_LANGUAGES.has(language) ? language : fallback
);

const readValidCardId = (url) => {
  const rawCardId = url.searchParams.get(URL_CARD_PARAM);

  if (rawCardId === null || rawCardId.trim() === '') {
    return null;
  }

  const cardId = Number(rawCardId);
  return Number.isInteger(cardId) && cardId >= 0 ? cardId : null;
};

export const readViewModeFromUrl = (href) => {
  const url = getUrl(href);

  if (readValidCardId(url) !== null) {
    return 'gallery';
  }

  const viewMode = url.searchParams.get(URL_VIEW_PARAM);
  return VALID_VIEW_MODES.has(viewMode) ? viewMode : 'reading';
};

export const readCardIdFromUrl = (href) => {
  const url = getUrl(href);
  return readValidCardId(url);
};

export const readLanguageFromUrl = (href, fallback = 'zh') => {
  const url = getUrl(href);
  return normalizeLanguage(url.searchParams.get(URL_LANGUAGE_PARAM), fallback);
};

export const updateUrlParams = (updates) => {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const nextRelativeUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentRelativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextRelativeUrl !== currentRelativeUrl) {
    window.history.replaceState(window.history.state, '', nextRelativeUrl);
  }

  return url.toString();
};

export const buildGalleryCardShareUrl = (cardId, language = 'zh') => {
  const url = getUrl();
  url.searchParams.set(URL_VIEW_PARAM, 'gallery');
  url.searchParams.set(URL_CARD_PARAM, String(cardId));
  url.searchParams.set(URL_LANGUAGE_PARAM, normalizeLanguage(language));
  return url.toString();
};
