import { prisma } from '@/lib/db';
import { json, guard } from '../_helpers';

export async function GET(req) {
  const g = guard(req, {}); if (g.error) return g.error;
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0,10);
  const dayStart = new Date(`${date}T09:00:00`);
  const slots = [];
  const taken = await prisma.appointment.findMany({
    where: {
      status: { in: ['SCHEDULED','CONFIRMED'] },
      startTime: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) },
    },
  });
  for (let i = 0; i < 16; i++) { // 9:00 - 17:00, 30-min slots
    const s = new Date(dayStart.getTime() + i * 30 * 60000);
    const busy = taken.some(t => s >= t.startTime && s < t.endTime);
    if (!busy && s > new Date()) slots.push(s.toISOString());
  }
  return json({ date, slots });
}
