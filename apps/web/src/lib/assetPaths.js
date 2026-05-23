export const getModernAssetPath = (path = '') => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  return path.replace(/\.(png|jpe?g)$/i, '.webp');
};

export const resolveAssetPath = (path = '') => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;

  const base = import.meta.env.BASE_URL;
  const normalized = getModernAssetPath(path);
  const cleanPath = normalized.startsWith('/') ? normalized.slice(1) : normalized;

  return `${base}${cleanPath}`;
};
