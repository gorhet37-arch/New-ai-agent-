import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';

const ALGO = 'aes-256-gcm';
const KEY = crypto.createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'dev-key-change-me')
  .digest();

export function encrypt(text) {
  if (text == null) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decrypt(payload) {
  if (!payload || !payload.includes(':')) return payload;
  try {
    const [ivH, tagH, dataH] = payload.split(':');
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivH, 'hex'));
    decipher.setAuthTag(Buffer.from(tagH, 'hex'));
    return decipher.update(Buffer.from(dataH, 'hex'), undefined, 'utf8') + decipher.final('utf8');
  } catch { return payload; }
}

export function sanitize(input) {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeObject(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = typeof v === 'string' ? sanitize(v) : v;
  }
  return out;
}

// CSRF token (double-submit cookie pattern)
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}
export function verifyCsrf(cookieToken, headerToken) {
  return cookieToken && headerToken && crypto.timingSafeEqual(
    Buffer.from(cookieToken), Buffer.from(headerToken)
  );
}
