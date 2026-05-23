import { describe, expect, it } from 'vitest';
import { mergeReadingWithBase } from './readingContract.js';
import { buildReading } from './tarotReading.js';

const cards = [
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

describe('mergeReadingWithBase', () => {
  it('falls back to spread-driven microcopy when ai fields are generic', () => {
    const baseReading = buildReading(cards, {
      language: 'zh',
      question: '我该怎样推进关系？',
    });

    const merged = mergeReadingWithBase(baseReading, {
      quote: '答案在你心里。',
      mantra: '先回到自己，再决定方向。',
      followUps: ['你真正想要的是什么？', '接下来最重要的是什么？'],
    });

    expect(merged.quote).toBe(baseReading.quote);
    expect(merged.mantra).toBe(baseReading.mantra);
    expect(merged.followUps).toEqual(baseReading.followUps);
  });

  it('keeps ai microcopy when it stays anchored to the spread', () => {
    const baseReading = buildReading(cards, {
      language: 'zh',
      question: '我该怎样推进关系？',
    });

    const merged = mergeReadingWithBase(baseReading, {
      quote: '圣杯二提醒你，先把连接说清，再回应月亮带来的迷雾散去。',
      mantra: '先看清连接，再回应迷雾散去。',
      followUps: [
        '愚者里的开始，为什么还在影响你对关系的判断？',
        '圣杯二所指向的连接，现在最需要你如何表达？',
      ],
    });

    expect(merged.quote).toBe('圣杯二提醒你，先把连接说清，再回应月亮带来的迷雾散去。');
    expect(merged.mantra).toBe('先看清连接，再回应迷雾散去。');
    expect(merged.followUps).toEqual([
      '愚者里的开始，为什么还在影响你对关系的判断？',
      '圣杯二所指向的连接，现在最需要你如何表达？',
    ]);
  });


  it('keeps literary ai microcopy even when it does not name card keywords directly', () => {
    const baseReading = buildReading(cards, {
      language: 'zh',
      question: '我该怎样推进关系？',
    });

    const merged = mergeReadingWithBase(baseReading, {
      quote: '有些情绪已经先一步走远了，你还站在原地听回声。',
      mantra: '先别急着追，先听见自己心里的回声。',
      followUps: [
        '那份悬着看了很久的迟疑，其实在替你守着什么？',
        '如果有些情绪已经先一步走远了，你还想把哪句话留给现在的自己？',
      ],
    });

    expect(merged.quote).toBe('有些情绪已经先一步走远了，你还站在原地听回声。');
    expect(merged.mantra).toBe('先别急着追，先听见自己心里的回声。');
    expect(merged.followUps).toEqual([
      '那份悬着看了很久的迟疑，其实在替你守着什么？',
      '如果有些情绪已经先一步走远了，你还想把哪句话留给现在的自己？',
    ]);
  });
});
