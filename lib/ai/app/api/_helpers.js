import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getUserFromReq, can } from '@/lib/auth';
import { verifyCsrf } from '@/lib/security';

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function guard(req, { permission, ip, mutate = false } = {}) {
  const key = ip || req.headers.get('x-forwarded-for') || 'anon';
  const rl = rateLimit(`${key}:${req.nextUrl.pathname}`, { max: 120 });
  if (!rl.ok) return { error: json({ error: 'Rate limit exceeded' }, 429) };

  if (mutate) {
    const cookieToken = req.cookies.get('csrf')?.value;
    const headerToken = req.headers.get('x-csrf-token');
    if (!verifyCsrf(cookieToken, headerToken)) {
      return { error: json({ error: 'CSRF validation failed' }, 403) };
    }
  }

  if (permission) {
    const user = getUserFromReq(req);
    if (!user) return { error: json({ error: 'Unauthorized' }, 401) };
    if (!can(user.role, permission)) return { error: json({ error: 'Forbidden' }, 403) };
    return { user };
  }
  return {};
}
