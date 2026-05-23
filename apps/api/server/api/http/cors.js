const env = globalThis.process?.env ?? {};

export const normalizeOriginList = (value) => {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildCorsOptions = (originValue = env.CORS_ORIGIN) => {
  const configuredOrigins = normalizeOriginList(originValue);

  return {
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: (origin, callback) => {
      if (configuredOrigins.length === 0) {
        callback(null, false);
        return;
      }

      if (configuredOrigins.includes('*')) {
        callback(null, true);
        return;
      }

      if (origin && configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (!origin && configuredOrigins.length === 1) {
        callback(null, configuredOrigins[0]);
        return;
      }

      callback(null, false);
    },
  };
};
