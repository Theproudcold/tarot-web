import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Gallery from './Gallery';
import { ToastProvider } from './ToastProvider';

vi.mock('./Card', () => ({
  default: ({ card }) => <div data-testid={`card-${card.id}`} aria-hidden="true" />,
}));

vi.mock('./CardDetailModal', () => ({
  default: ({ card, onClose, onShare, t }) => (card ? (
    <div data-testid="card-detail-modal">
      <div>{card.name.en}</div>
      <button type="button" onClick={onClose}>Close Modal</button>
      <button type="button" onClick={onShare}>{t('galleryShareAction')}</button>
    </div>
  ) : null),
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
  galleryShareAction: 'Share Link',
  galleryShareCopied: 'Link copied and ready to share.',
  galleryShareShared: 'Share sheet opened.',
  galleryShareFailed: 'Could not share this link right now.',
  galleryToastFavoriteAdded: 'Added to favorites.',
  galleryToastFavoriteRemoved: 'Removed from favorites.',
  galleryToastCompareAdded: 'Added to compare.',
  galleryToastCompareRemoved: 'Removed from compare.',
  galleryToastCompareCleared: 'Compare list cleared.',
  galleryToastRecentCleared: 'Recently viewed cleared.',
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
const clipboardWriteText = vi.fn();

const renderGallery = () => render(
  <ToastProvider>
    <Gallery cards={cards} language="en" t={t} />
  </ToastProvider>,
);

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
    window.history.replaceState({}, '', '/');
    clipboardWriteText.mockReset();
    clipboardWriteText.mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('filters cards by search term', () => {
    renderGallery();

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Magician' } });

    expect(screen.getByText('The Magician')).toBeInTheDocument();
    expect(screen.queryByText('Ace of Cups')).not.toBeInTheDocument();
  });

  it('stores favorites and supports favorites-only mode', () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Fool')).getByRole('button', { name: 'Add to favorites' }));

    expect(window.localStorage.getItem('tarot-gallery-favorite-card-ids')).toBe('[1]');
    expect(screen.getByRole('status')).toHaveTextContent('Added to favorites.');

    fireEvent.click(screen.getAllByRole('button', { name: 'Favorites Only' })[0]);

    expect(screen.getAllByText('The Fool').length).toBeGreaterThan(0);
    expect(screen.queryByText('The Magician')).not.toBeInTheDocument();
  });

  it('limits compare selection to three cards', () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Fool')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(within(getCardArticle('The Magician')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(within(getCardArticle('Ace of Cups')).getByRole('button', { name: 'Add to compare' }));

    const fourthCompareButton = within(getCardArticle('Two of Swords')).getByRole('button', { name: 'Add to compare' });
    expect(fourthCompareButton).toBeDisabled();
    expect(screen.getByText('Selected 3/3')).toBeInTheDocument();
  });

  it('toggles the mobile filter label', () => {
    renderGallery();

    const toggleButton = screen.getByRole('button', { name: /Show Filters/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /Hide Filters/i })).toBeInTheDocument();
  });

  it('opens the detail modal from the URL card param', () => {
    window.history.replaceState({}, '', '/?view=gallery&card=2');

    renderGallery();

    expect(screen.getByTestId('card-detail-modal')).toHaveTextContent('The Magician');
  });

  it('syncs modal open and close state to the URL', () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Fool')).getByTestId('card-1'));

    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).toContain('card=1');

    fireEvent.click(screen.getByRole('button', { name: 'Close Modal' }));

    expect(window.location.search).toContain('view=gallery');
    expect(window.location.search).not.toContain('card=1');
  });

  it('copies a shareable deep link for the current card', async () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Magician')).getByTestId('card-2'));
    fireEvent.click(screen.getByRole('button', { name: 'Share Link' }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledTimes(1);
    });

    const copiedUrl = new URL(clipboardWriteText.mock.calls[0][0]);
    expect(copiedUrl.searchParams.get('view')).toBe('gallery');
    expect(copiedUrl.searchParams.get('card')).toBe('2');
    expect(copiedUrl.searchParams.get('lang')).toBe('en');
    expect(screen.getByText('Link copied and ready to share.')).toBeInTheDocument();
  });

  it('shows a toast when compare cards are cleared', () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Fool')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(within(getCardArticle('The Magician')).getByRole('button', { name: 'Add to compare' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear Compare' }));

    expect(screen.getByRole('status')).toHaveTextContent('Compare list cleared.');
  });

  it('shows a toast when recent cards are cleared', () => {
    renderGallery();

    fireEvent.click(within(getCardArticle('The Fool')).getByTestId('card-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear Recent' }));

    expect(screen.getByRole('status')).toHaveTextContent('Recently viewed cleared.');
  });
});
