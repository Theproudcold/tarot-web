import { runReadingOrchestrator } from '../orchestrator.js';

// Keep this boundary small so a future LangGraph workflow can replace the hand-written orchestrator.
export const runReadingWorkflow = async (payload, options = {}) => runReadingOrchestrator(payload, {
  onPhase: options.onPhase,
  onPartialReading: options.onPartialReading || options.onPartial,
});
