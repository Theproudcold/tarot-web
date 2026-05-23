import { describe, expect, it, vi } from 'vitest';

vi.mock('../orchestrator.js', () => ({
  runReadingOrchestrator: vi.fn(async (_payload, options) => {
    await options.onPhase?.({ stage: 'draft', status: 'started' });
    await options.onPartialReading?.({ stage: 'draft', reading: { summary: 'draft' } });

    return { reading: { summary: 'done' } };
  }),
}));

const { runReadingOrchestrator } = await import('../orchestrator.js');
const { runReadingWorkflow } = await import('./readingWorkflow.js');

describe('runReadingWorkflow', () => {
  it('forwards phase and partial callbacks to the orchestrator', async () => {
    const onPhase = vi.fn();
    const onPartial = vi.fn();

    const result = await runReadingWorkflow({
      language: 'zh',
      cards: [],
      createdAt: '2026-05-23T00:00:00.000Z',
    }, { onPhase, onPartial });

    expect(runReadingOrchestrator).toHaveBeenCalledOnce();
    expect(onPhase).toHaveBeenCalledWith({ stage: 'draft', status: 'started' });
    expect(onPartial).toHaveBeenCalledWith({ stage: 'draft', reading: { summary: 'draft' } });
    expect(result).toEqual({ reading: { summary: 'done' } });
  });
});
