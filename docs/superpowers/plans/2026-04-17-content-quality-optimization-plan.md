# Content Quality Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为塔罗解读内容建立可重复验证的评测基线，并据此优化 prompt 资产、fallback 策略和调试闭环。

**Architecture:** 先在 `server/ai/evals` 建立固定样本与评分规则，再让 prompt / few-shot / fallback 都围绕这套基线迭代。内容生成链路仍保持现有多 Agent + 本地回退架构，不新增外部服务依赖。

**Tech Stack:** `Node.js`、`Vitest`、现有 `React/Vite` 项目结构、现有 `server/ai` 与 `src/lib` 模块

---

### Task 1: 建立固定内容评测样本集

**Files:**
- Create: `server/ai/evals/contentFixtures.js`
- Create: `server/ai/evals/contentRubric.js`
- Test: `server/ai/evals/contentRubric.test.js`

- [ ] **Step 1: 写失败测试，固定最小样本结构和评分维度**

```js
import { describe, expect, it } from 'vitest';
import { contentFixtures } from './contentFixtures.js';
import { scoreReadingQuality } from './contentRubric.js';

describe('content quality rubric', () => {
  it('exposes at least one relationship fixture and one decision fixture', () => {
    expect(contentFixtures.some((item) => item.scenario === 'relationship')).toBe(true);
    expect(contentFixtures.some((item) => item.scenario === 'decision')).toBe(true);
  });

  it('flags generic microcopy as low quality', () => {
    const result = scoreReadingQuality({
      quote: '答案在你心里。',
      mantra: '顺其自然。',
      advice: ['相信自己。'],
      followUps: ['你真正想要的是什么？'],
    }, {
      anchors: ['圣杯二', '月亮', '水'],
    });

    expect(result.nonGeneric.passed).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- server/ai/evals/contentRubric.test.js`
Expected: FAIL with missing module or missing export errors

- [ ] **Step 3: 实现 fixtures 与 rubric 最小版本**

```js
export const contentFixtures = [
  {
    id: 'relationship-water-tension',
    scenario: 'relationship',
    language: 'zh',
    question: '我该怎样推进这段关系？',
  },
  {
    id: 'decision-air-earth-balance',
    scenario: 'decision',
    language: 'zh',
    question: '我要不要换工作？',
  },
];
```

```js
export const scoreReadingQuality = (reading, context) => ({
  nonGeneric: {
    passed: false,
    reasons: ['placeholder'],
  },
});
```

- [ ] **Step 4: 实现完整评分逻辑**

```js
export const scoreReadingQuality = (reading, context) => {
  // 输出至少包括 anchoring、cohesion、actionability、nonGeneric 四类结果
};
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test:run -- server/ai/evals/contentRubric.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai/evals/contentFixtures.js server/ai/evals/contentRubric.js server/ai/evals/contentRubric.test.js
git commit -m "feat: add content quality fixtures and rubric"
```

### Task 2: 增加本地内容评测执行器

**Files:**
- Create: `server/ai/evals/runContentEval.js`
- Modify: `package.json`
- Test: `server/ai/evals/runContentEval.test.js`

- [ ] **Step 1: 写失败测试，固定评测输出结构**

```js
import { describe, expect, it } from 'vitest';
import { formatEvalReport } from './runContentEval.js';

describe('runContentEval', () => {
  it('formats fixture results with pass/fail summary', () => {
    const output = formatEvalReport([
      { id: 'case-a', passed: true },
      { id: 'case-b', passed: false },
    ]);

    expect(output).toContain('case-a');
    expect(output).toContain('PASS');
    expect(output).toContain('FAIL');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- server/ai/evals/runContentEval.test.js`
Expected: FAIL with missing module/export

- [ ] **Step 3: 实现最小执行器与脚本**

```js
export const formatEvalReport = (results) =>
  results.map((item) => `${item.id}: ${item.passed ? 'PASS' : 'FAIL'}`).join('\n');
```

```json
{
  "scripts": {
    "eval:content": "node server/ai/evals/runContentEval.js"
  }
}
```

- [ ] **Step 4: 运行测试与脚本**

Run: `npm run test:run -- server/ai/evals/runContentEval.test.js`
Expected: PASS

Run: `npm run eval:content`
Expected: 输出每个 fixture 的汇总结果和总通过率

- [ ] **Step 5: Commit**

```bash
git add server/ai/evals/runContentEval.js server/ai/evals/runContentEval.test.js package.json
git commit -m "feat: add local content eval runner"
```

### Task 3: 分场景扩展 few-shot 与 prompt 资产

**Files:**
- Modify: `server/ai/agents/fewShotExamples.js`
- Modify: `server/ai/agents/draftAgent.js`
- Modify: `server/ai/agents/reviewAgent.js`
- Modify: `server/ai/agents/finalizeAgent.js`
- Test: `server/ai/agents/promptInstructions.test.js`

- [ ] **Step 1: 写失败测试，固定场景化 few-shot 注入规则**

```js
it('injects scenario-specific examples for relationship prompts', async () => {
  await runDraftAgent({ context, aiConfig: {} });
  const taskConfig = mockedProvider.runStructuredOpenAITask.mock.calls[0][0];
  expect(taskConfig.instructions).toContain('relationship');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- server/ai/agents/promptInstructions.test.js`
Expected: FAIL on missing scenario-specific examples

- [ ] **Step 3: 扩展 few-shot 数据结构**

```js
const scenarioExamples = {
  relationship: { zh: [], en: [] },
  decision: { zh: [], en: [] },
  lowInfo: { zh: [], en: [] },
};
```

- [ ] **Step 4: 根据 context 选择注入的 few-shot 内容**

```js
const fewShotBlock = buildFewShotBlock(language, {
  scenario: detectScenario(context),
});
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test:run -- server/ai/agents/promptInstructions.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai/agents/fewShotExamples.js server/ai/agents/draftAgent.js server/ai/agents/reviewAgent.js server/ai/agents/finalizeAgent.js server/ai/agents/promptInstructions.test.js
git commit -m "feat: expand scenario-specific prompt assets"
```

### Task 4: 强化 fallback 与合并判断

**Files:**
- Modify: `src/lib/readingContract.js`
- Test: `src/lib/readingContract.test.js`
- Test: `src/lib/tarotReading.test.js`

- [ ] **Step 1: 写失败测试，覆盖“文艺但空泛”和“重复 followUps”场景**

```js
it('falls back when follow-ups ask the same thing twice with different wording', () => {
  // assert fallback
});

it('keeps literary microcopy when it stays unique to the spread', () => {
  // assert no fallback
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/lib/readingContract.test.js src/lib/tarotReading.test.js`
Expected: FAIL on new fallback expectations

- [ ] **Step 3: 实现联合判定逻辑**

```js
const shouldFallbackReflectionText = (text, baseReading) => {
  // 组合模板句、锚点稀薄、低信息密度、重复表达等条件
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test:run -- src/lib/readingContract.test.js src/lib/tarotReading.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/readingContract.js src/lib/readingContract.test.js src/lib/tarotReading.test.js
git commit -m "feat: strengthen reading fallback heuristics"
```

### Task 5: 补齐调试与报告输出

**Files:**
- Modify: `server/ai/debugMicrocopy.js`
- Test: `server/ai/debugMicrocopy.test.js`
- Modify: `README.md`

- [ ] **Step 1: 写失败测试，固定 fallback 原因输出**

```js
it('records fallback reasons for replaced fields', () => {
  // assert reason metadata exists
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- server/ai/debugMicrocopy.test.js`
Expected: FAIL because reason metadata is missing

- [ ] **Step 3: 扩展调试数据结构**

```js
replaced: {
  quote: true,
  mantra: true,
  followUps: true,
},
reasons: {
  quote: ['generic-pattern'],
  mantra: ['missing-anchor'],
}
```

- [ ] **Step 4: 在 README 中补充评测与调试说明**

```md
## 内容质量评测

运行 `npm run eval:content` 查看固定样本评测结果。
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test:run -- server/ai/debugMicrocopy.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai/debugMicrocopy.js server/ai/debugMicrocopy.test.js README.md
git commit -m "docs: document content eval and debug flow"
```

### Task 6: 全量验证

**Files:**
- Modify: `README.md`
- Test: `server/ai/agents/promptInstructions.test.js`
- Test: `server/ai/debugMicrocopy.test.js`
- Test: `src/lib/readingContract.test.js`
- Test: `src/lib/tarotReading.test.js`

- [ ] **Step 1: 运行核心测试集**

Run: `npm run test:run -- server/ai/agents/promptInstructions.test.js server/ai/debugMicrocopy.test.js src/lib/readingContract.test.js src/lib/tarotReading.test.js`
Expected: PASS

- [ ] **Step 2: 运行内容评测脚本**

Run: `npm run eval:content`
Expected: 输出固定样本汇总，并且能区分通过 / 失败案例

- [ ] **Step 3: 运行 lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "chore: verify content quality optimization baseline"
```
