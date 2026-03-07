import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Gallery from './Gallery';

vi.mock('./Card', () => ({
  default: ({ card }) => <div data-testid={`card-${card.id}`} aria-hidden="true" />,
}));

vi.mock('./CardDetailModal', () => ({
  default: ({ card }) => (card ? <div data-testid="card-detail-modal">{card.name.en}</div> : null),
}));

const cards = [
  {
    id: 1,
    name: { en: 'The Fool', zh: '愚者' },
    suite: { en: 'Major Arcana', zh: '大阿卡那' },
    image: '/cards/fool.webp',
    element: 'Air',
    meaning_upright: { en: 'Fresh start', zh: '新的开始' },
    meaning_reversed: { en: 'Reckless', zh: '鲁莽' },
  },
  {
    id: 2,
    name: { en: 'The Magician', zh: '魔术师' },
    suite: { en: 'Major Arcana', zh: '大阿卡那' },
    image: '/cards/magician.webp',
    element: 'Fire',
    meaning_upright: { en: 'Manifestation', zh: '显化' },
    meaning_reversed: { en: 'Manipulation', zh: '操控' },
  },
  {
    id: 3,
    name: { en: 'Ace of Cups', zh: '圣杯一' },
    suite: { en: 'Cups', zh: '圣杯' },
    image: '/cards/cups-ace.webp',
    element: 'Water',
    meaning_upright: { en: 'Love', zh: '爱' },
    meaning_reversed: { en: 'Blocked emotion', zh: '情绪受阻' },
  },
  {
    id: 4,
    name: { en: 'Two of Swords', zh: '宝剑二' },
    suite: { en: 'Swords', zh: '宝剑' },
    image: '/cards/swords-two.webp',
    element: 'Air',
    meaning_upright: { en: 'Decision', zh: '决断' },
    meaning_reversed: { en: 'Confusion', zh: '混乱' },
  },
];

const translations = {
  galleryElementFire: 'Fire',
  galleryElementWater: 'Water',
  galleryElementAir: 'Air',
  galleryElementEarth: 'Earth',
  galleryModeLabel: 'Browse Mode',
  galleryViewGrid: 'Grid View',
  galleryViewGrouped: 'Grouped View',
  galleryFavoritesOnly: 'Favorites Only',
  galleryFiltersOpen: 'Show Filters',
  galleryFiltersClose: 'Hide Filters',
  galleryGroupedHint: 'Grouped hint',
  galleryGridHint: 'Grid hint',
  galleryResultsPrefix: 'Results',
  galleryFavoritesTitle: 'Favorites',
  galleryCompareTitle: 'Card Compare',
  gallerySearchLabel: 'Search',
  gallerySearchPlaceholder: 'Search cards',
  galleryArcanaLabel: 'Arcana',
  galleryFilterAll: 'All',
  galleryArcanaMajor: 'Major Arcana',
  galleryArcanaMinor: 'Minor Arcana',
  gallerySuiteLabel: 'Suit',
  galleryElementLabel: 'Element',
  gallerySortLabel: 'Sort & Density',
  gallerySortArcana: 'Sort by suit',
  gallerySortName: 'Sort by name',
  gallerySortElement: 'Sort by element',
  gallerySortFavorites: 'Favorites first',
  gallerySortId: 'Sort by id',
  galleryDensityCompact: 'Compact',
  galleryDensityComfortable: 'Comfortable',
  galleryClearFilters: 'Clear filters',
  galleryCompareRemove: 'Remove from compare',
  galleryCompareAdd: 'Add to compare',
  galleryCompareAddShort: 'Compare',
  galleryCompareAddedShort: 'Added',
  galleryFavoriteRemove: 'Remove from favorites',
  galleryFavoriteAdd: 'Add to favorites',
  galleryCompareHint: 'Compare hint',
  galleryCompareClear: 'Clear Compare',
  galleryCompareCounter: 'Selected',
  galleryCompareNeedMore: 'Choose at least two cards for a more useful comparison.',
  upright: 'Upright',
  reversed: 'Reversed',
  viewDetails: 'View Details',
  galleryFavoritesHint: 'Favorites hint',
  galleryRecentTitle: 'Recently Viewed',
  galleryRecentHint: 'Recent hint',
  galleryRecentClear: 'Clear Recent',
  galleryQuickJumpTitle: 'Quick Jump',
  gallerySectionPrefix: '',
  gallerySectionSuffix: 'cards',
  galleryLoadMore: 'Load more',
  galleryEmptyTitle: 'No cards',
  galleryEmptyHint: 'No results',
  galleryTitle: 'Card Gallery',
  galleryEyebrow: 'Tarot Atlas',
  gallerySubtitle: 'Gallery subtitle',
  galleryStatTotal: 'Total',
  galleryStatVisible: 'Matches',
  galleryStatShowing: 'Showing',
};

const t = (key) => translations[key] ?? key;

const getCardArticle = (name) => {
  const cardTitle = screen.getByText(name);
  const article = cardTitle.closest('article');

  if (!article) {
    throw new Error(`Card article not found for ${name}`);
  }

  return article;
};

describe('Gallery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('filters cards by search term', () => {
    render(<Gallery cards={cards} language="en" t={t} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Magician' } });

    expect(screen.getByText('The Magician')).toBeInTheDocument();
    expect(screen.queryByText('Ace of Cups')).not.toBeInTheDocument();
  });

  it('stores favorites and supports favorites-only mode', () => {
    render(<Gallery cards={cards} language="en" t={t} />);

    fireEvent.click(within(getCardArticle('The Fool')).getByRole('button', { name: 'Add to favorites' }));

    expect(window.localStorage.getItem('tarot-gallery-favorite-card-ids')).toBe('[1]');

    fireEvent.click(screen.getAllByRole('button', { name: 'Favorites Only' })[0]);

    expect(screen.getAllByText('The Fool').length).toBeGreaterThan(0);
    expect(screen.queryByText('The Magician')).not.toBeInTheDocument();
  });

  it('limits compare selection to three cards', () => {
    render(<Gallery cards={cards} language="en" t={t} />);

    fireEvent.click(within(getCardArticle('The Fool')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(within(getCardArticle('The Magician')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(within(getCardArticle('Ace of Cups')).getByRole('button', { name: 'Add to compare' }));

    const fourthCompareButton = within(getCardArticle('Two of Swords')).getByRole('button', { name: 'Add to compare' });
    expect(fourthCompareButton).toBeDisabled();
    expect(screen.getByText('Selected 3/3')).toBeInTheDocument();
  });

  it('toggles the mobile filter label', () => {
    render(<Gallery cards={cards} language="en" t={t} />);

    const toggleButton = screen.getByRole('button', { name: /Show Filters/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /Hide Filters/i })).toBeInTheDocument();
  });
});
