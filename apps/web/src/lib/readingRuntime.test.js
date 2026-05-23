import { describe, expect, it } from 'vitest';
import { getDisplayedPhases, getTimelineState } from './readingRuntime.js';

describe('reading runtime timeline', () => {
  it('creates the multi-agent default pipeline in order', () => {
    expect(getDisplayedPhases({
      phases: [],
      orchestration: 'multi',
      language: 'zh',
      loading: true,
    }).map((phase) => phase.stage)).toEqual(['draft', 'review', 'finalize']);
  });

  it('places fallback after failed pipeline stages', () => {
    const displayed = getDisplayedPhases({
      phases: [
        { stage: 'review', status: 'failed', detail: 'model overloaded' },
        { stage: 'fallback', status: 'triggered', detail: 'mock fallback used' },
      ],
      orchestration: 'multi',
      language: 'zh',
      loading: false,
    });

    expect(displayed.map((phase) => phase.stage)).toEqual(['draft', 'review', 'finalize', 'fallback']);
    expect(displayed.find((phase) => phase.stage === 'fallback').detail).toBe('mock fallback used');
  });

  it('reports finalize sync while final text is still streaming', () => {
    const displayed = getDisplayedPhases({
      phases: [
        { stage: 'draft', status: 'completed' },
        { stage: 'review', status: 'completed' },
        { stage: 'finalize', status: 'completed' },
      ],
      orchestration: 'multi',
      language: 'zh',
      loading: true,
    });

    expect(getTimelineState({
      displayedPhases: displayed,
      orchestration: 'multi',
      loading: true,
    }).kind).toBe('finalize-sync');
  });

  it('marks completed stages from the final reading pipeline', () => {
    const displayed = getDisplayedPhases({
      phases: [],
      orchestration: 'multi',
      language: 'zh',
      loading: false,
      reading: { agentPipeline: ['draft', 'review', 'finalize'] },
    });

    expect(displayed.every((phase) => phase.status === 'completed')).toBe(true);
  });
});
