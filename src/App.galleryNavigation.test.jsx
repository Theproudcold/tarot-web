import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./data/tarotCards', () => ({
  tarotCards: [
    {
      id: 0,
      name: { en: 'The Fool', zh: '愚者' },
      suite: { en: 'Major Arcana', zh: '大阿卡那' },
      image: '/cards/fool.webp',
      element: 'Air',
      meaning_upright: { en: 'Fresh start', zh: '新的开始' },
      meaning_reversed: { en: 'Reckless', zh: '鲁莽' },
    },
    {
      id: 1,
      name: { en: 'The Magician', zh: '魔术师' },
      suite: { en: 'Major Arcana', zh: '大阿卡那' },
      image: '/cards/magician.webp',
      element: 'Fire',
      meaning_upright: { en: 'Manifestation', zh: '显化' },
      meaning_reversed: { en: 'Manipulation', zh: '操控' },
    },
  ],
}));

vi.mock('./components/Card', () => ({
  default: ({ card }) => <div data-testid={`card-${card.id}`} aria-hidden="true" />,
}));

vi.mock('./components/CardSelector', () => ({
  default: () => <div>Card Selector</div>,
}));

vi.mock('./components/Spread', () => ({
  default: () => <div>Spread</div>,
}));

vi.mock('./components/Interpretation', () => ({
  default: () => <div>Interpretation</div>,
}));

vi.mock('./components/RuntimeStatusBar', () => ({
  default: () => null,
}));

vi.mock('./components/AiSettingsPanel', () => ({
  default: () => <div>AI Settings</div>,
}));

vi.mock('./components/History', () => ({
  default: () => <div>History View</div>,
}));

vi.mock('./lib/readingApi.js', () => ({
  requestReadingStream: vi.fn(),
}));

vi.mock('./lib/historyStorage', () => ({
  createHistoryRecord: vi.fn(),
  upsertHistoryRecord: vi.fn(),
}));

vi.mock('./lib/aiSettings', () => ({
  loadAiSettings: () => ({}),
  saveAiSettings: vi.fn(),
}));

vi.mock('./lib/readingContract.js', () => ({
  mergeReadingWithBase: vi.fn(),
}));

describe('App gallery navigation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('does not auto-open card 0 when gallery url has no card param', () => {
    window.history.replaceState({}, '', '/?view=gallery&lang=zh');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(screen.queryByRole('dialog', { name: '愚者' })).not.toBeInTheDocument();
  });

  it('closes the detail modal when clicking Gallery from a deep-linked gallery state', async () => {
    window.history.replaceState({}, '', '/?view=gallery&card=1&lang=zh');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(screen.getByRole('dialog', { name: '魔术师' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '全牌图鉴' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '魔术师' })).not.toBeInTheDocument();
    });

    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).not.toContain('card=');
  });

  it('keeps Gallery on the overview when reopening it after leaving a deep link', async () => {
    window.history.replaceState({}, '', '/?view=gallery&card=0&lang=zh');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(screen.getByRole('dialog', { name: '愚者' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '塔罗占卜' }));
    fireEvent.click(screen.getByRole('button', { name: '全牌图鉴' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '愚者' })).not.toBeInTheDocument();
    });

    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).not.toContain('card=');
  });
});
