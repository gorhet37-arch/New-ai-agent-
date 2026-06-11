import { prisma } from '@/lib/db';
import { json, guard } from '../_helpers';
import { leadSchema, validate } from '@/lib/validation';
import { sanitizeObject } from '@/lib/security';
import { scoreLead } from '@/lib/ai/scoring';

export async function GET(req) {
  const g = guard(req, { permission: 'leads:read' }); if (g.error) return g.error;
  const { searchParams } = req.nextUrl;
  const where = {};
  const temp = searchParams.get('temperature'); if (temp) where.temperature = temp;
  const status = searchParams.get('status'); if (status) where.status = status;
  const leads = await prisma.lead.findMany({
    where, orderBy: { score: 'desc' }, take: 200,
    include: { appointments: true, _count: { select: { messages: true } } },
  });
  return json({ leads });
}

export async function POST(req) {
  const g = guard(req, { permission: 'leads:write', mutate: true }); if (g.error) return g.error;
  const v = validate(leadSchema, sanitizeObject(await req.json()));
  if (!v.ok) return json({ errors: v.errors }, 422);
  const { score, temperature } = scoreLead(v.data);
  const lead = await prisma.lead.create({ data: { ...v.data, score, temperature } });
  return json({ lead }, 201);
}
