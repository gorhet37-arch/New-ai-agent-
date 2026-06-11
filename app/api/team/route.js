import { prisma } from '@/lib/db';
import { json, guard } from '../_helpers';
import { hashPassword } from '@/lib/auth';
import { sanitizeObject } from '@/lib/security';
import { z } from 'zod';
import { emailRx } from '@/lib/validation';

const memberSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().regex(emailRx, 'Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT', 'VIEWER']),
});

export async function GET(req) {
  // Team list requires elevated rights; reuse a custom permission check via role
  const g = guard(req, {}); if (g.error) return g.error;
  const { getUserFromReq, can } = await import('@/lib/auth');
  const user = getUserFromReq(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (!(user.role === 'ADMIN' || user.role === 'MANAGER')) return json({ error: 'Forbidden' }, 403);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return json({ users });
}

export async function POST(req) {
  const g = guard(req, { mutate: true }); if (g.error) return g.error;
  const { getUserFromReq } = await import('@/lib/auth');
  const user = getUserFromReq(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'ADMIN') return json({ error: 'Only admins can add members' }, 403);

  const parsed = memberSchema.safeParse(sanitizeObject(await req.json()));
  if (!parsed.success) return json({ errors: parsed.error.flatten().fieldErrors }, 422);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return json({ error: 'A user with that email already exists' }, 409);

  const created = await prisma.user.create({
    data: { ...parsed.data, password: await hashPassword(parsed.data.password) },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return json({ user: created }, 201);
}
