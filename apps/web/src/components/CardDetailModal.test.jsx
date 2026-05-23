import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CardDetailModal from './CardDetailModal';

vi.mock('./Card', () => ({
  default: ({ card }) => <div data-testid={`card-${card.id}`} aria-hidden="true" />,
}));

const card = {
  id: 7,
  name: { en: 'The Chariot', zh: '战车' },
  suite: { en: 'Major Arcana', zh: '大阿卡那' },
  element: 'Water',
  meaning_upright: { en: 'Control', zh: '掌控' },
  meaning_reversed: { en: 'Directionless', zh: '失去方向' },
};

const translations = {
  galleryElementFire: 'Fire',
  galleryElementWater: 'Water',
  galleryElementAir: 'Air',
  galleryElementEarth: 'Earth',
  galleryDetailEyebrow: 'Card Insight',
  galleryShareAction: 'Share Link',
  galleryCompareAdd: 'Add to compare',
  galleryFavoriteAdd: 'Add to favorites',
  galleryPreviousCard: 'Previous card',
  galleryNextCard: 'Next card',
  galleryModalHint: 'Modal hint',
  closeModal: 'Close modal',
};

const t = (key) => translations[key] ?? key;

describe('CardDetailModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders action buttons without a local status region', () => {
    render(
      <CardDetailModal
        card={card}
        language="en"
        onClose={vi.fn()}
        onShare={vi.fn()}
        onToggleCompare={vi.fn()}
        onToggleFavorite={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByRole('button', { name: 'Share Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to compare' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the localized detail content', () => {
    render(
      <CardDetailModal
        card={card}
        language="en"
        onClose={vi.fn()}
        onShare={vi.fn()}
        onToggleCompare={vi.fn()}
        onToggleFavorite={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('The Chariot')).toBeInTheDocument();
    expect(screen.getByText('Major Arcana')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Directionless')).toBeInTheDocument();
  });
});
