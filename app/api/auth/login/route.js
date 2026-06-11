import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
import { generateCsrfToken } from '@/lib/security';
import { json } from '../../_helpers';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const rl = rateLimit(`login:${ip}`, { max: 10, windowMs: 300000 });
  if (!rl.ok) return json({ error: 'Too many attempts' }, 429);

  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password)))
    return json({ error: 'Invalid credentials' }, 401);

  const token = signToken(user);
  const csrf = generateCsrfToken();
  const res = json({ user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 604800, path: '/' });
  res.cookies.set('csrf', csrf, { sameSite: 'lax', secure: true, maxAge: 604800, path: '/' });
  return res;
}
