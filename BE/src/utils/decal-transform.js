const DEFAULT_TRANSFORM = Object.freeze({ x: undefined, y: undefined, z: 0, rotation: 0, scale: 1, opacity: 1 });

const normalizeDecalTransform = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('decalTransform must be an object.'); error.statusCode = 400; throw error;
  }
  for (const key of Object.keys(DEFAULT_TRANSFORM)) {
    if (value[key] !== undefined && (typeof value[key] !== 'number' || !Number.isFinite(value[key]))) {
      const error = new Error(`decalTransform.${key} must be a finite number.`); error.statusCode = 400; throw error;
    }
  }
  return Object.fromEntries(Object.entries(DEFAULT_TRANSFORM).map(([key, fallback]) => [key, value[key] ?? fallback]));
};

module.exports = normalizeDecalTransform;
