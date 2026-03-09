import { afterEach, describe, expect, it } from 'vitest';
import { buildMicrocopyDebugEntry, isMicrocopyDebugEnabled } from './debugMicrocopy.js';

const originalFlag = process.env.AI_DEBUG_MICROCOPY;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.AI_DEBUG_MICROCOPY = originalFlag;
  process.env.NODE_ENV = originalNodeEnv;
});

describe('debugMicrocopy', () => {
  it('builds a comparison entry for raw and final microcopy', () => {
    const entry = buildMicrocopyDebugEntry({
      flow: 'multi',
      stage: 'final',
      source: 'openai',
      model: 'gpt-test',
      raw: {
        quote: '答案在你心里。',
        mantra: '先回到自己，再决定方向。',
        followUps: ['你真正想要的是什么？'],
      },
      final: {
        quote: '圣杯二提醒你先把连接说清。',
        mantra: '先看清连接，再回应迷雾散去。',
        followUps: ['圣杯二所指向的连接，现在最需要你如何表达？'],
      },
    });

    expect(entry.replaced).toEqual({
      quote: true,
      mantra: true,
      followUps: true,
    });
    expect(entry.raw.quote).toBe('答案在你心里。');
    expect(entry.final.mantra).toBe('先看清连接，再回应迷雾散去。');
  });

  it('stays disabled in test unless explicitly enabled', () => {
    delete process.env.AI_DEBUG_MICROCOPY;
    process.env.NODE_ENV = 'test';

    expect(isMicrocopyDebugEnabled()).toBe(false);

    process.env.AI_DEBUG_MICROCOPY = '1';
    expect(isMicrocopyDebugEnabled()).toBe(true);
  });
});
