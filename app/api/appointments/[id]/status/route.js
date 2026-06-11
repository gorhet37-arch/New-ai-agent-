import { prisma } from '@/lib/db';
import { json, guard } from '../../../_helpers';
import { startNoShowRecovery, requestReview, postAppointmentFollowup } from '@/lib/automation';

export async function PATCH(req, { params }) {
  const g = guard(req, { permission: 'appts:write', mutate: true }); if (g.error) return g.error;
  const { status } = await req.json();
  const appt = await prisma.appointment.update({
    where: { id: params.id }, data: { status }, include: { lead: true },
  });

  if (status === 'NO_SHOW') await startNoShowRecovery(appt);      // Agent 8
  if (status === 'COMPLETED') {                                    // Agents 9 + 10
    await prisma.lead.update({ where: { id: appt.leadId }, data: { status: 'COMPLETED' } });
    await postAppointmentFollowup(appt);
    await requestReview(appt.lead);
  }
  return json({ appointment: appt });
}
