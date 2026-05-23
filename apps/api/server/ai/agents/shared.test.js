import { describe, expect, it } from 'vitest';
import { buildAgentContext } from './shared.js';

const cards = [
  {
    id: 0,
    name: { zh: '愚者', en: 'The Fool' },
    suite: { zh: '大阿卡那', en: 'Major Arcana' },
    element: 'Air',
    meaning_upright: { zh: '开始', en: 'Beginnings' },
    meaning_reversed: { zh: '鲁莽', en: 'Reckless' },
  },
  {
    id: 1,
    name: { zh: '圣杯二', en: 'Two of Cups' },
    suite: { zh: '圣杯', en: 'Cups' },
    element: 'Water',
    meaning_upright: { zh: '关系', en: 'Connection' },
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

describe('buildAgentContext', () => {
  it('keeps only summary and advice from previous readings', () => {
    const context = buildAgentContext({
      cards,
      language: 'zh',
      question: '我要如何推进这段关系？',
      previousReading: {
        summary: '上一轮总结',
        advice: ['上一轮建议'],
        followUps: ['上一轮追问'],
        mantra: '上一轮锚定语',
      },
    });

    expect(context.previousReading).toEqual({
      summary: '上一轮总结',
      advice: ['上一轮建议'],
    });
  });
});
