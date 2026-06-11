import { prisma } from '@/lib/db';
import { json, guard } from '../_helpers';

export async function GET(req) {
  const g = guard(req, { permission: 'analytics:read' }); if (g.error) return g.error;
  const [leads, qualified, booked, noShows, completed, reviews] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { temperature: 'HOT' } }),
    prisma.appointment.count({ where: { status: { in: ['SCHEDULED','CONFIRMED','COMPLETED'] } } }),
    prisma.appointment.count({ where: { status: 'NO_SHOW' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.lead.count({ where: { reviewStatus: 'completed' } }),
  ]);
  const revenueAgg = await prisma.lead.aggregate({ _sum: { revenueGenerated: true } });
  const visitors = await prisma.lead.count(); // visitors == leads created via chat
  const tempDist = await prisma.lead.groupBy({ by: ['temperature'], _count: true });

  return json({
    kpis: {
      visitors, leads, qualified, booked, noShows, conversions: completed,
      revenue: revenueAgg._sum.revenueGenerated || 0, reviews,
      conversionRate: leads ? ((completed / leads) * 100).toFixed(1) : 0,
      noShowRate: booked ? ((noShows / booked) * 100).toFixed(1) : 0,
    },
    funnel: [
      { stage: 'Visitors', value: visitors },
      { stage: 'Leads', value: leads },
      { stage: 'Qualified', value: qualified },
      { stage: 'Booked', value: booked },
      { stage: 'Converted', value: completed },
    ],
    temperature: tempDist.map(t => ({ name: t.temperature, value: t._count })),
  });
}
