const truthyValues = new Set(['1', 'true', 'yes', 'on']);
const falsyValues = new Set(['0', 'false', 'no', 'off']);

const getEnv = () => globalThis.process?.env ?? {};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const getMicrocopySnapshot = (value = {}) => ({
  quote: normalizeText(value?.quote) || null,
  mantra: normalizeText(value?.mantra) || null,
  followUps: Array.isArray(value?.followUps)
    ? value.followUps.filter((item) => typeof item === 'string' && item.trim())
    : [],
});

export const isMicrocopyDebugEnabled = () => {
  const env = getEnv();
  const rawFlag = normalizeText(env.AI_DEBUG_MICROCOPY).toLowerCase();

  if (truthyValues.has(rawFlag)) return true;
  if (falsyValues.has(rawFlag)) return false;

  return !env.NODE_ENV || env.NODE_ENV === 'development';
};

export const buildMicrocopyDebugEntry = ({
  flow,
  stage,
  source = null,
  model = null,
  raw = null,
  final = null,
}) => {
  const rawSnapshot = getMicrocopySnapshot(raw);
  const finalSnapshot = getMicrocopySnapshot(final);

  return {
    flow,
    stage,
    source,
    model,
    raw: rawSnapshot,
    final: finalSnapshot,
    replaced: {
      quote: rawSnapshot.quote !== finalSnapshot.quote,
      mantra: rawSnapshot.mantra !== finalSnapshot.mantra,
      followUps: JSON.stringify(rawSnapshot.followUps) !== JSON.stringify(finalSnapshot.followUps),
    },
  };
};

export const logMicrocopyDebug = (options = {}) => {
  if (!isMicrocopyDebugEnabled()) {
    return;
  }

  const entry = buildMicrocopyDebugEntry(options);
  console.info('[ai microcopy debug]', JSON.stringify(entry, null, 2));
};
