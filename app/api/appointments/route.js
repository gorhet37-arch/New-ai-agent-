import { prisma } from '@/lib/db';
import { json, guard } from '../_helpers';
import { apptSchema, validate } from '@/lib/validation';
import { sanitizeObject } from '@/lib/security';
import { queueConfirmation, scheduleReminders } from '@/lib/automation';

const REMINDER_OFFSETS = [1440, 720, 60, 15]; // minutes before

export async function GET(req) {
  const g = guard(req, { permission: 'appts:read' }); if (g.error) return g.error;
  const appts = await prisma.appointment.findMany({
    include: { lead: true, reminders: true }, orderBy: { startTime: 'asc' },
  });
  return json({ appointments: appts });
}

export async function POST(req) {
  const g = guard(req, { permission: 'appts:write', mutate: true }); if (g.error) return g.error;
  const v = validate(apptSchema, sanitizeObject(await req.json()));
  if (!v.ok) return json({ errors: v.errors }, 422);

  const start = new Date(v.data.startTime);
  if (isNaN(start) || start < new Date())
    return json({ error: 'Invalid or past time' }, 422);
  const end = new Date(start.getTime() + v.data.durationMin * 60000);

  // Double-booking / conflict prevention
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    },
  });
  if (conflict) return json({ error: 'Time slot unavailable (conflict)' }, 409);

  const appt = await prisma.appointment.create({
    data: {
      leadId: v.data.leadId,
      startTime: start, endTime: end,
      timezone: v.data.timezone,
      location: v.data.location || 'Video Call',
      meetingLink: `https://meet.convertai.app/${Math.random().toString(36).slice(2, 10)}`,
      status: 'SCHEDULED',
    },
    include: { lead: true },
  });

  await prisma.lead.update({ where: { id: v.data.leadId }, data: { status: 'BOOKED' } });

  // Automation: confirmation + reminders
  await queueConfirmation(appt);
  await scheduleReminders(appt, REMINDER_OFFSETS);

  return json({ appointment: appt }, 201);
}
