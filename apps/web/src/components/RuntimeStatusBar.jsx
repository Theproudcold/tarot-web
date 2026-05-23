import React, { useEffect, useMemo, useState } from 'react';
import { hasAiOverrides } from '../lib/aiSettings.js';
import { getAiRuntimeInfo } from '../lib/readingApi.js';
import { getOrchestrationLabel } from '../lib/orchestrationLabels.js';
import { getReadingSourceLabel, resolveReadingSourceKey } from '../lib/readingSource.js';

const STORAGE_KEY = 'tarot_runtime_status_visible';

const RuntimeStatusBar = ({ reading = null, orchestration = null, selectedOrchestration = null, settings = null, language = 'en', t }) => {
  const [runtimeInfo, setRuntimeInfo] = useState(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(STORAGE_KEY) !== '0';
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, isExpanded ? '1' : '0');
  }, [isExpanded]);

  const providerLabel = useMemo(() => {
    const providerKey = resolveReadingSourceKey({
      readingSource: reading?.source,
      runtimeProvider: runtimeInfo?.provider,
      settings,
    });

    return providerKey ? getReadingSourceLabel(providerKey, language, reading?.providerLabel || settings?.providerLabel || '') : '-';
  }, [language, reading?.providerLabel, reading?.source, runtimeInfo?.provider, settings]);

  const orchestrationLabel = useMemo(() => {
    const value = reading?.orchestration || orchestration || selectedOrchestration || runtimeInfo?.orchestration;
    return getOrchestrationLabel(value, language) || '-';
  }, [language, orchestration, reading?.orchestration, runtimeInfo?.orchestration, selectedOrchestration]);

  const modelLabel = reading?.model || runtimeInfo?.model || '-';
  const scopeLabel = reading
    ? t('aiRuntimeScopeReading')
    : hasAiOverrides(settings) || selectedOrchestration
      ? t('aiRuntimeScopeSelected')
      : t('aiRuntimeScopeDefault');

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-[360px]">
      <div className="flex flex-col items-end gap-3">
        {isExpanded && (
          <div className="pointer-events-auto w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md animate-fadeIn">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-tarot-gold/70">{t('aiRuntimeTitle')}</p>
                <p className="mt-1 text-xs text-gray-400">{scopeLabel}</p>
              </div>
              <span className="rounded-full border border-tarot-gold/25 bg-tarot-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-tarot-gold/90">
                {orchestrationLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] md:text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('aiConfigTestProvider')}</p>
                <p className="mt-1 text-gray-100">{providerLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('aiOrchestrationLabel')}</p>
                <p className="mt-1 text-gray-100">{orchestrationLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('aiConfigTestModel')}</p>
                <p className="mt-1 truncate text-gray-100" title={modelLabel}>{modelLabel}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-tarot-gold/30 bg-black/75 px-4 py-2 text-xs text-tarot-gold shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-tarot-gold hover:text-tarot-bg"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t('aiRuntimeHide') : t('aiRuntimeShow')}
        >
          <span className="text-sm">{isExpanded ? '◢' : '◤'}</span>
          <span>{isExpanded ? t('aiRuntimeHide') : t('aiRuntimeShow')}</span>
        </button>
      </div>
    </div>
  );
};

export default RuntimeStatusBar;
