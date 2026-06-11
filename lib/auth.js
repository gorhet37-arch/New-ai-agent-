import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const hashPassword = (pw) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

const PERMISSIONS = {
  ADMIN:   ['*'],
  MANAGER: ['leads:read','leads:write','appts:read','appts:write','analytics:read','reviews:read'],
  AGENT:   ['leads:read','leads:write','appts:read','appts:write'],
  VIEWER:  ['leads:read','appts:read','analytics:read'],
};

export function can(role, permission) {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function getUserFromReq(req) {
  const auth = req.headers.get?.('authorization') || req.headers.authorization;
  const token = auth?.replace('Bearer ', '') ||
    req.cookies?.get?.('token')?.value || req.cookies?.token;
  return token ? verifyToken(token) : null;
}
