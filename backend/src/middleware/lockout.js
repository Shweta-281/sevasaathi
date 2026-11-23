import { config } from '../config.js';
const attempts = new Map();

export function checkLockout(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt >= config.LOCKOUT_WINDOW_MIN * 60_000) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= config.LOCKOUT_MAX_ATTEMPTS;
}
export function recordFailure(key) {
  const entry = attempts.get(key) || { count: 0, firstAt: Date.now() };
  entry.count += 1;
  attempts.set(key, entry);
}
export function resetFailures(key) { attempts.delete(key); }