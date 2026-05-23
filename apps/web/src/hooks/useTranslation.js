import { useState, useCallback } from 'react';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

const languages = { en, zh };

export const useTranslation = (initialLang = 'zh') => {
  const [language, setLanguage] = useState(initialLang);

  const t = (key) => {
    const keys = key.split('.');
    let value = languages[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    return value;
  };

  const getLocalized = useCallback((obj) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj[language] || obj['en'] || '';
  }, [language]);

  return { t, language, setLanguage, getLocalized };
};
