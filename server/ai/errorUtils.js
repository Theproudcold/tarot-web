const extractMessageFromObject = (value, fallbackMessage) => {
  if (!value || typeof value !== 'object') {
    return fallbackMessage;
  }

  return value.error?.message || value.message || value.detail || fallbackMessage;
};

export const getErrorDetail = (error, fallbackMessage = 'Unknown error') => {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      return extractMessageFromObject(parsed, error);
    } catch {
      return error;
    }
  }

  if (error instanceof Error) {
    if (!error.message) {
      return fallbackMessage;
    }

    try {
      const parsed = JSON.parse(error.message);
      return extractMessageFromObject(parsed, error.message);
    } catch {
      return error.message;
    }
  }

  return extractMessageFromObject(error, fallbackMessage);
};
