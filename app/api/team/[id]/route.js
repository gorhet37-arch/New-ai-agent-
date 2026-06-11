import { prisma } from '@/lib/db';
import { json, guard } from '../../_helpers';
import { getUserFromReq } from '@/lib/auth';

export async function DELETE(req, { params }) {
  const g = guard(req, { mutate: true }); if (g.error) return g.error;
  const user = getUserFromReq(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'ADMIN') return json({ error: 'Only admins can remove members' }, 403);

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return json({ error: 'User not found' }, 404);
  if (target.role === 'ADMIN') return json({ error: 'Cannot remove an admin' }, 403);
  if (target.id === user.id) return json({ error: 'Cannot remove yourself' }, 403);

  await prisma.user.delete({ where: { id: params.id } });
  return json({ ok: true });
}
