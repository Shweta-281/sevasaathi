const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);

function clean(value, depth = 0) {
  if (depth > 32) return null;
  if (typeof value === 'string') return value.replaceAll('\0', '').trim();
  if (Array.isArray(value)) return value.map((item) => clean(item, depth + 1));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (blockedKeys.has(key)) delete value[key];
      else value[key] = clean(value[key], depth + 1);
    }
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') clean(req.body);
  next();
}
