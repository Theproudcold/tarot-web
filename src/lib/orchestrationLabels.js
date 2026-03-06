export const orchestrationLabels = {
  en: {
    multi: 'Three-agent',
    single: 'Single agent',
    mock: 'Mock fallback',
  },
  zh: {
    multi: '三省协作',
    single: '单代理',
    mock: '模拟回退',
  },
};

export const getOrchestrationLabel = (value, language = 'en') => {
  const labels = orchestrationLabels[language] || orchestrationLabels.en;
  return labels[value] || value || null;
};
