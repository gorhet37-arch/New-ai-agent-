import { prisma } from '@/lib/db';
import { json, guard } from '../../_helpers';
import { requestReferral } from '@/lib/automation';

export async function POST(req) {
  const g = guard(req, { mutate: true }); if (g.error) return g.error;
  const { leadId, revenue } = await req.json();
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { reviewStatus: 'completed', revenueGenerated: { increment: revenue || 0 } },
  });
  await requestReferral(lead); // IF review completed THEN trigger referral
  return json({ ok: true, lead });
}
