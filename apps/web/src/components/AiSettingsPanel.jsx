import React, { useEffect, useMemo, useState } from 'react';
import { hasAiOverrides } from '../lib/aiSettings';
import { getOrchestrationLabel } from '../lib/orchestrationLabels.js';
import { getAiRuntimeInfo, testAiConnection } from '../lib/readingApi';
import { getReadingSourceLabel, resolveReadingSourceKey } from '../lib/readingSource.js';

const fieldClassName = 'mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-tarot-gold/40';

const statusStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  mock: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
};

const idleTestState = {
  status: 'idle',
  result: null,
  error: '',
};

const AiSettingsPanel = ({ settings, onChange, orchestration = null, language = 'en', t }) => {
  const [isOpen, setIsOpen] = useState(() => hasAiOverrides(settings));
  const [runtimeInfo, setRuntimeInfo] = useState(null);
  const [testState, setTestState] = useState(idleTestState);

  const status = useMemo(() => (
    hasAiOverrides(settings) ? t('aiConfigEnabled') : t('aiConfigDisabled')
  ), [settings, t]);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeInfo = async () => {
      try {
        const info = await getAiRuntimeInfo();
        if (!cancelled) {
          setRuntimeInfo(info);
        }
      } catch {
        if (!cancelled) {
          setRuntimeInfo(null);
        }
      }
    };

    void loadRuntimeInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  const orchestrationLabel = useMemo(() => (
    getOrchestrationLabel(orchestration || testState.result?.orchestration || runtimeInfo?.orchestration, language)
  ), [language, orchestration, runtimeInfo?.orchestration, testState.result?.orchestration]);

  const resetTestState = () => {
    setTestState(idleTestState);
  };

  const handleFieldChange = (field) => (event) => {
    resetTestState();
    onChange((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleToggleChange = (event) => {
    resetTestState();
    onChange((current) => ({
      ...current,
      enabled: event.target.checked,
    }));
  };

  const handleClear = () => {
    resetTestState();
    onChange({
      enabled: false,
      apiBaseUrl: '',
      apiKey: '',
      model: '',
      providerLabel: '',
      orchestrationMode: '',
    });
  };

  const handleTestConnection = async () => {
    setTestState({
      status: 'loading',
      result: null,
      error: '',
    });

    try {
      const result = await testAiConnection({ aiConfig: settings });
      setRuntimeInfo((current) => ({
        ...current,
        orchestration: result.orchestration || current?.orchestration || null,
      }));
      setTestState({
        status: result.status === 'mock' ? 'mock' : 'success',
        result,
        error: '',
      });
    } catch (error) {
      let nextError = t('aiConfigTestError');

      if (error instanceof Error && error.message) {
        try {
          const parsed = JSON.parse(error.message);
          nextError = parsed.error || error.message;
        } catch {
          nextError = error.message;
        }
      }

      setTestState({
        status: 'error',
        result: null,
        error: nextError,
      });
    }
  };

  const testLabel = testState.status === 'loading' ? t('aiConfigTesting') : t('aiConfigTest');
  const hasTestFeedback = testState.status === 'success' || testState.status === 'mock' || testState.status === 'error';
  const resultOrchestrationLabel = getOrchestrationLabel(testState.result?.orchestration, language);
  const resultProviderLabel = getReadingSourceLabel(
    resolveReadingSourceKey({ runtimeProvider: testState.result?.provider, settings }) || 'local-fallback',
    language,
    settings.providerLabel || ''
  );

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-black/30 p-4 text-left backdrop-blur-sm md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif text-tarot-gold md:text-xl">{t('aiConfigTitle')}</h2>
          <p className="mt-2 text-sm text-gray-400">{t('aiConfigDescription')}</p>
        </div>
        <button
          onClick={() => setIsOpen((current) => !current)}
          className="shrink-0 rounded-full border border-tarot-gold/30 px-3 py-1 text-xs text-tarot-gold transition-colors hover:bg-tarot-gold hover:text-tarot-bg"
        >
          {isOpen ? t('aiConfigCollapse') : t('aiConfigExpand')}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-tarot-gold/30 bg-tarot-gold/10 px-3 py-1 uppercase tracking-[0.2em] text-tarot-gold">
          {status}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-gray-400">
          {t('aiConfigLocalOnly')}
        </span>
        {orchestrationLabel && (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
            {t('aiOrchestrationLabel')}: {orchestrationLabel}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <label htmlFor="ai-orchestration-mode" className="text-sm font-medium text-gray-100">
              {t('aiConfigOrchestration')}
            </label>
            <p className="mt-1 text-xs text-gray-400">{t('aiConfigOrchestrationHint')}</p>
            <select
              id="ai-orchestration-mode"
              value={settings.orchestrationMode || ''}
              onChange={handleFieldChange('orchestrationMode')}
              className={fieldClassName}
            >
              <option value="">{t('aiConfigOrchestrationDefault')}</option>
              <option value="multi">{t('aiConfigOrchestrationMulti')}</option>
              <option value="single">{t('aiConfigOrchestrationSingle')}</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(settings.enabled)}
              onChange={handleToggleChange}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-tarot-gold focus:ring-tarot-gold/50"
            />
            <span>
              <span className="block text-sm font-medium text-gray-100">{t('aiConfigEnableLabel')}</span>
              <span className="mt-1 block text-xs text-gray-400">{t('aiConfigEnableHint')}</span>
            </span>
          </label>

          <div>
            <label htmlFor="ai-base-url" className="text-sm font-serif text-tarot-gold">
              {t('aiConfigBaseUrl')}
            </label>
            <input
              id="ai-base-url"
              type="text"
              value={settings.apiBaseUrl || ''}
              onChange={handleFieldChange('apiBaseUrl')}
              placeholder={t('aiConfigBaseUrlPlaceholder')}
              className={fieldClassName}
              autoComplete="url"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="ai-api-key" className="text-sm font-serif text-tarot-gold">
              {t('aiConfigApiKey')}
            </label>
            <input
              id="ai-api-key"
              type="password"
              value={settings.apiKey || ''}
              onChange={handleFieldChange('apiKey')}
              placeholder={t('aiConfigApiKeyPlaceholder')}
              className={fieldClassName}
              autoComplete="off"
              spellCheck={false}
            />
          </div>


          <div>
            <label htmlFor="ai-provider-label" className="text-sm font-serif text-tarot-gold">
              {t('aiConfigProviderLabel')}
            </label>
            <input
              id="ai-provider-label"
              type="text"
              value={settings.providerLabel || ''}
              onChange={handleFieldChange('providerLabel')}
              placeholder={t('aiConfigProviderLabelPlaceholder')}
              className={fieldClassName}
              autoComplete="organization"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="ai-model" className="text-sm font-serif text-tarot-gold">
              {t('aiConfigModel')}
            </label>
            <input
              id="ai-model"
              type="text"
              value={settings.model || ''}
              onChange={handleFieldChange('model')}
              placeholder={t('aiConfigModelPlaceholder')}
              className={fieldClassName}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-400">{t('aiConfigFallbackHint')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestConnection}
                disabled={testState.status === 'loading'}
                className="rounded-full border border-tarot-gold/40 px-4 py-2 text-sm text-tarot-gold transition-colors hover:bg-tarot-gold hover:text-tarot-bg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testLabel}
              </button>
              <button
                onClick={handleClear}
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                {t('aiConfigClear')}
              </button>
            </div>
          </div>

          {hasTestFeedback && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusStyles[testState.status]}`}>
              <p className="font-medium">
                {testState.status === 'success' && t('aiConfigTestSuccess')}
                {testState.status === 'mock' && t('aiConfigTestMock')}
                {testState.status === 'error' && t('aiConfigTestFailed')}
              </p>
              {testState.status === 'error' ? (
                <p className="mt-2 break-words text-xs opacity-90">{testState.error}</p>
              ) : (
                <div className="mt-3 space-y-2 text-xs opacity-90">
                  <p><span className="text-white/70">{t('aiConfigTestProvider')}:</span> {resultProviderLabel || '-'}</p>
                  <p><span className="text-white/70">{t('aiConfigTestModel')}:</span> {testState.result?.model || '-'}</p>
                  <p><span className="text-white/70">{t('aiConfigTestMode')}:</span> {testState.result?.mode || '-'}</p>
                  <p><span className="text-white/70">{t('aiConfigTestOrchestration')}:</span> {resultOrchestrationLabel || '-'}</p>
                  {testState.result?.endpoint && (
                    <p className="break-all"><span className="text-white/70">{t('aiConfigTestEndpoint')}:</span> {testState.result.endpoint}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AiSettingsPanel;
