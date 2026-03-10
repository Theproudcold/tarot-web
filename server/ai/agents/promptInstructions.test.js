import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedProvider = vi.hoisted(() => ({
  runStructuredOpenAITask: vi.fn(async () => ({
    parsed: {},
    source: 'openai',
    model: 'gpt-test',
  })),
  streamStructuredOpenAITask: vi.fn(async () => ({
    parsed: {},
    source: 'openai',
    model: 'gpt-test',
    streamed: true,
  })),
}));

vi.mock('../providers/openaiProvider.js', async () => {
  const actual = await vi.importActual('../providers/openaiProvider.js');

  return {
    ...actual,
    runStructuredOpenAITask: mockedProvider.runStructuredOpenAITask,
    streamStructuredOpenAITask: mockedProvider.streamStructuredOpenAITask,
  };
});

import { runDraftAgent } from './draftAgent.js';
import { runFinalizeAgent } from './finalizeAgent.js';
import { runReviewAgent } from './reviewAgent.js';

const context = {
  language: 'zh',
  question: '我接下来该怎么推进关系？',
  dominantElement: {
    key: 'Water',
    label: '水',
    count: 2,
    percent: 67,
    description: '情绪与直觉正在主导。',
  },
  elementDistribution: [
    { key: 'Water', label: '水', count: 2, percent: 67 },
    { key: 'Air', label: '风', count: 1, percent: 33 },
  ],
  cards: [
    { slot: 'past', cardName: '愚者', orientation: '正位', element: 'Air', meaning: '开始' },
    { slot: 'present', cardName: '圣杯二', orientation: '正位', element: 'Water', meaning: '关系' },
    { slot: 'future', cardName: '月亮', orientation: '逆位', element: 'Water', meaning: '不安' },
  ],
  previousReading: {
    summary: '上一轮总结',
    advice: ['上一轮建议'],
  },
};

const draft = {
  summary: '初稿总结',
  quote: '初稿星辰低语',
  perCard: [
    { slot: 'past', message: '过去位' },
    { slot: 'present', message: '现在位' },
    { slot: 'future', message: '未来位' },
  ],
  advice: ['建议 1', '建议 2'],
  followUps: ['问题 1', '问题 2'],
  mantra: '锚定语',
  safetyNote: '说明',
};

describe('agent prompt instructions', () => {
  beforeEach(() => {
    mockedProvider.runStructuredOpenAITask.mockClear();
    mockedProvider.streamStructuredOpenAITask.mockClear();
  });

  it('includes enhanced role identity with quality standard', async () => {
    await runDraftAgent({ context, aiConfig: {} });

    const taskConfig = mockedProvider.runStructuredOpenAITask.mock.calls[0][0];

    // 验证角色身份增强
    expect(taskConfig.instructions).toContain('可替换性测试');
    expect(taskConfig.instructions).toContain('身份');
    expect(taskConfig.instructions).toContain('解读哲学');
  });

  it('tells draft agent to keep quote, mantra, and followUps spread-specific with CoT guidance', async () => {
    await runDraftAgent({ context, aiConfig: {} });

    const taskConfig = mockedProvider.runStructuredOpenAITask.mock.calls[0][0];

    // 验证反套话指令
    expect(taskConfig.instructions).toContain('可替换性测试');
    expect(taskConfig.instructions).toContain('机械堆砌牌名');

    // 验证 CoT 推理引导
    expect(taskConfig.instructions).toContain('内部推理流程');
    expect(taskConfig.instructions).toContain('元素张力');
    expect(taskConfig.instructions).toContain('锚点');

    // 验证 Few-shot 对照示例
    expect(taskConfig.instructions).toContain('不合格');
    expect(taskConfig.instructions).toContain('合格');
    expect(taskConfig.instructions).toContain('风格参考');

    // 验证 input 中的独特张力提示
    expect(taskConfig.input).toContain('独特张力');
  });

  it('tells review agent to flag generic template lines with scoring dimensions', async () => {
    await runReviewAgent({ context, draft, aiConfig: {} });

    const taskConfig = mockedProvider.runStructuredOpenAITask.mock.calls[0][0];

    // 验证审查维度
    expect(taskConfig.instructions).toContain('叙事连贯性');
    expect(taskConfig.instructions).toContain('牌面锚定度');
    expect(taskConfig.instructions).toContain('行动可执行性');
    expect(taskConfig.instructions).toContain('反套话检测');

    // 验证可替换性测试
    expect(taskConfig.instructions).toContain('可替换性测试');
    expect(taskConfig.instructions).toContain('模板句');
    expect(taskConfig.instructions).toContain('教科书术语');
    expect(taskConfig.instructions).toContain('revisionPlan');

    // 验证 input 中的审查提示
    expect(taskConfig.input).toContain('不要为了求新而改');
    expect(taskConfig.input).toContain('可替换性测试');
  });

  it('tells finalize agent to rewrite templated quote and mantra fields with contrast examples', async () => {
    await runFinalizeAgent({
      context,
      draft,
      review: { strengths: [], risks: [], revisionPlan: {} },
      candidate: draft,
      aiConfig: {},
    });

    const taskConfig = mockedProvider.runStructuredOpenAITask.mock.calls[0][0];

    // 验证 Few-shot 反面对照注入
    expect(taskConfig.instructions).toContain('不合格');
    expect(taskConfig.instructions).toContain('合格');

    // 验证反套话指令
    expect(taskConfig.instructions).toContain('这次专属');
    expect(taskConfig.instructions).toContain('答案在你心里');
    expect(taskConfig.instructions).toContain('机械塞入牌名');

    // 验证终极自检
    expect(taskConfig.instructions).toContain('可替换性测试');

    // 验证 input 中的对照提示
    expect(taskConfig.input).toContain('不合格 vs 合格');
    expect(taskConfig.input).toContain('可替换性测试');
  });
});
