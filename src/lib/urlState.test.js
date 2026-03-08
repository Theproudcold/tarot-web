import { describe, expect, it } from 'vitest';
import { buildGalleryCardShareUrl, readLanguageFromUrl, readViewModeFromUrl } from './urlState.js';

describe('urlState helpers', () => {
  it('reads the language param from the URL', () => {
    expect(readLanguageFromUrl('http://localhost/?lang=en')).toBe('en');
    expect(readLanguageFromUrl('http://localhost/?lang=zh')).toBe('zh');
    expect(readLanguageFromUrl('http://localhost/?lang=invalid')).toBe('zh');
  });

  it('treats card deep links as gallery view', () => {
    expect(readViewModeFromUrl('http://localhost/?view=reading&card=7')).toBe('gallery');
  });

  it('builds gallery share links with the active language', () => {
    const englishShareUrl = new URL(buildGalleryCardShareUrl(9, 'en'));
    expect(englishShareUrl.searchParams.get('view')).toBe('gallery');
    expect(englishShareUrl.searchParams.get('card')).toBe('9');
    expect(englishShareUrl.searchParams.get('lang')).toBe('en');

    const chineseShareUrl = new URL(buildGalleryCardShareUrl(9, 'zh'));
    expect(chineseShareUrl.searchParams.get('view')).toBe('gallery');
    expect(chineseShareUrl.searchParams.get('card')).toBe('9');
    expect(chineseShareUrl.searchParams.get('lang')).toBe('zh');
  });
});
