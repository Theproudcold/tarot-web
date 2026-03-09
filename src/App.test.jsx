import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./data/tarotCards', () => ({
  tarotCards: [
    {
      id: 2,
      name: { en: 'The Magician', zh: '魔术师' },
      suite: { en: 'Major Arcana', zh: '大阿卡那' },
      meaning_upright: { en: 'Manifestation', zh: '显化' },
      meaning_reversed: { en: 'Manipulation', zh: '操控' },
    },
  ],
}));

vi.mock('./components/CardSelector', () => ({
  default: () => <div>Card Selector</div>,
}));

vi.mock('./components/Spread', () => ({
  default: () => <div>Spread</div>,
}));

vi.mock('./components/Gallery', () => ({
  default: () => <div>Gallery View</div>,
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

describe('App deep linking', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the gallery view when the URL targets a card deep link', () => {
    window.history.replaceState({}, '', '/?view=gallery&card=2&lang=en');

    render(<App />);

    expect(screen.getByText('Gallery View')).toBeInTheDocument();
  });

  it('syncs the selected top-level view to the URL', () => {
    window.history.replaceState({}, '', '/?lang=en');

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).toContain('lang=en');

    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(window.location.search).toContain('view=history');
    expect(window.location.search).toContain('lang=en');
    expect(window.location.search).not.toContain('card=');
  });

  it('clears the selected card when gallery navigation is clicked manually', () => {
    window.history.replaceState({}, '', '/?view=gallery&card=2&lang=en');

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));

    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).toContain('lang=en');
    expect(window.location.search).not.toContain('card=');
  });

  it('syncs language toggles to the URL', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(window.location.search).toContain('lang=en');

    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(window.location.search).toContain('lang=zh');
  });

  it('renders a GitHub link in the header', () => {
    render(<App />);

    const githubLink = screen.getByRole('link', { name: 'GitHub' });

    expect(githubLink).toHaveAttribute('href', 'https://github.com/Theproudcold/tarot-web');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noreferrer');
  });
});
