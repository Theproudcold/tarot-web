import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Interpretation from './Interpretation.jsx';
import { zh } from '../locales/zh.js';

const t = (key) => zh[key] || key;

const cards = [
  { id: 1, name: { zh: '魔术师', en: 'The Magician' }, isReversed: false },
  { id: 2, name: { zh: '女祭司', en: 'The High Priestess' }, isReversed: false },
  { id: 3, name: { zh: '皇后', en: 'The Empress' }, isReversed: true },
];

const reading = {
  language: 'zh',
  source: 'openai',
  orchestration: 'multi',
  model: 'gpt-5-mini',
  question: '我该怎么推进计划？',
  quote: '把模糊的念头落到今天能做的一步。',
  summary: '这组牌提示你先整理信息，再推进关键行动。',
  elementDistribution: [
    { key: 'Fire', label: '火', percent: 34 },
    { key: 'Water', label: '水', percent: 33 },
    { key: 'Air', label: '风', percent: 33 },
  ],
  dominantElement: {
    label: '火',
    description: '行动力正在成为主导。',
  },
  perCard: [
    {
      slot: 'past',
      slotLabel: '过去',
      title: '魔术师',
      orientationLabel: '正位',
      keyword: '启动',
      message: '你已经具备起步所需的资源。',
    },
    {
      slot: 'present',
      slotLabel: '现在',
      title: '女祭司',
      orientationLabel: '正位',
      keyword: '观察',
      message: '现在需要先把隐藏信息看清。',
    },
    {
      slot: 'future',
      slotLabel: '未来',
      title: '皇后',
      orientationLabel: '逆位',
      keyword: '失衡',
      message: '后续要避免只投入不收束。',
    },
  ],
  advice: ['今天先确认一个可执行动作。'],
  followUps: ['哪件事可以在今天被具体推进？'],
  mantra: '先落地，再扩张。',
  safetyNote: '这不是命令，只是帮助你整理选择。',
};

describe('Interpretation runtime flow', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the Chinese reading flow timeline and orchestration mode', () => {
    render(
      <Interpretation
        cards={cards}
        language="zh"
        reading={reading}
        loading={false}
        phases={[
          { stage: 'draft', status: 'completed' },
          { stage: 'review', status: 'completed' },
          { stage: 'finalize', status: 'completed' },
        ]}
        orchestration="multi"
        t={t}
      />
    );

    expect(screen.getByText('解读流程')).toBeInTheDocument();
    expect(screen.getAllByText(/编排模式/).length).toBeGreaterThan(0);
  });
});
