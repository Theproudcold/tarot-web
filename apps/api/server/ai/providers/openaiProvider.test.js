import { describe, expect, it } from 'vitest';
import { buildSingleAgentInput } from './openaiProvider.js';

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
  },
];

describe('buildSingleAgentInput', () => {
  it('asks for spread-specific quote, mantra, and follow-ups', () => {
    const input = buildSingleAgentInput({
      cards,
      language: 'zh',
      question: '我该怎样推进关系？',
      previousReading: {
        summary: '上一轮总结',
        advice: ['上一轮建议'],
      },
    });

    expect(input).toContain('quote、mantra、followUps');
    expect(input).toContain('当前三张牌与用户问题');
    expect(input).toContain('机械堆砌牌名');
    expect(input).toContain('不要复用 previousReading');
  });
});
