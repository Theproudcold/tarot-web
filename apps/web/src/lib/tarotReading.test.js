import { describe, expect, it } from 'vitest';
import { buildReading } from './tarotReading.js';

const relationshipCards = [
  {
    id: 0,
    name: { zh: '愚者', en: 'The Fool' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Air',
    meaning_upright: { zh: '开始', en: 'Beginnings' },
    meaning_reversed: { zh: '鲁莽', en: 'Recklessness' },
  },
  {
    id: 1,
    name: { zh: '圣杯二', en: 'Two of Cups' },
    suite: { zh: '圣杯', en: 'Cups' },
    element: 'Water',
    meaning_upright: { zh: '连接', en: 'Connection' },
    meaning_reversed: { zh: '失衡', en: 'Imbalance' },
  },
  {
    id: 2,
    name: { zh: '月亮', en: 'The Moon' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Water',
    meaning_upright: { zh: '直觉', en: 'Intuition' },
    meaning_reversed: { zh: '迷雾散去', en: 'Clarity returning' },
    isReversed: true,
  },
];

const careerCards = [
  {
    id: 8,
    name: { zh: '力量', en: 'Strength' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Fire',
    meaning_upright: { zh: '勇气', en: 'Courage' },
    meaning_reversed: { zh: '自我怀疑', en: 'Self-doubt' },
  },
  {
    id: 9,
    name: { zh: '隐士', en: 'The Hermit' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Earth',
    meaning_upright: { zh: '内省', en: 'Introspection' },
    meaning_reversed: { zh: '孤立', en: 'Isolation' },
  },
  {
    id: 10,
    name: { zh: '命运之轮', en: 'Wheel of Fortune' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Fire',
    meaning_upright: { zh: '转折', en: 'Turning point' },
    meaning_reversed: { zh: '阻滞', en: 'Resistance' },
  },
];

describe('buildReading microcopy', () => {
  it('generates spread-specific quote, mantra, and follow-ups', () => {
    const reading = buildReading(relationshipCards, {
      language: 'zh',
      question: '我该怎样推进关系？',
    });

    expect(reading.quote).toMatch(/愚者|圣杯二|月亮|开始|连接|迷雾散去|水|风/);
    expect(reading.mantra).toMatch(/连接|迷雾散去|水|开始/);
    expect(reading.followUps).toHaveLength(3);
    expect(reading.followUps.join(' ')).toMatch(/愚者|圣杯二|月亮|开始|连接|迷雾散去/);
  });

  it('varies microcopy across different spreads', () => {
    const relationshipReading = buildReading(relationshipCards, {
      language: 'zh',
      question: '我该怎样推进关系？',
    });
    const careerReading = buildReading(careerCards, {
      language: 'zh',
      question: '我该怎样推进工作？',
    });

    expect(relationshipReading.quote).not.toBe(careerReading.quote);
    expect(relationshipReading.mantra).not.toBe(careerReading.mantra);
    expect(relationshipReading.followUps).not.toEqual(careerReading.followUps);
  });
});
