import { prisma } from '@/lib/db';
import { sendEmail, sendSMS, sendWhatsApp } from './comms';
import { runReviewAgent, runRetentionAgent, runUpsellAgent, runPostAppointmentAgent } from './ai/agents';
import { format } from 'date-fns';

function fmt(d, tz) { return new Date(d).toLocaleString('en-US', { timeZone: tz || 'UTC' }); }

// Agent 6 — Confirmation
export async function queueConfirmation(appt) {
  const { lead } = appt;
  const body = `Hi ${lead.name || 'there'}! Your appointment is confirmed for ${fmt(appt.startTime, appt.timezone)}.
Location: ${appt.location}. Meeting link: ${appt.meetingLink}`;
  await Promise.all([
    sendEmail(lead.email, 'Your appointment is confirmed ✅', `<p>${body}</p>`),
    sendSMS(lead.phone, body),
    sendWhatsApp(lead.phone, body),
  ]);
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'CONFIRMATION', status: 'done' } });
  await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CONFIRMED' } });
}

// Agent 7 — Reminders (scheduled, executed by worker)
export async function scheduleReminders(appt, offsets) {
  const channels = ['EMAIL', 'SMS', 'WHATSAPP'];
  const data = [];
  for (const offset of offsets) {
    const scheduledFor = new Date(appt.startTime.getTime() - offset * 60000);
    if (scheduledFor < new Date()) continue;
    for (const channel of channels) data.push({ appointmentId: appt.id, offsetMinutes: offset, channel, scheduledFor });
  }
  if (data.length) await prisma.reminder.createMany({ data });
}

export async function dispatchDueReminders() {
  const due = await prisma.reminder.findMany({
    where: { sent: false, scheduledFor: { lte: new Date() } },
    include: { appointment: { include: { lead: true } } },
  });
  for (const r of due) {
    const a = r.appointment, lead = a.lead;
    if (['CANCELLED','COMPLETED','NO_SHOW'].includes(a.status)) {
      await prisma.reminder.update({ where: { id: r.id }, data: { sent: true } });
      continue;
    }
    const hrs = r.offsetMinutes >= 60 ? `${r.offsetMinutes/60} hour(s)` : `${r.offsetMinutes} minutes`;
    const msg = `Reminder: your appointment is in ${hrs} (${fmt(a.startTime, a.timezone)}). Link: ${a.meetingLink}`;
    let res = { delivered: false };
    if (r.channel === 'EMAIL') res = await sendEmail(lead.email, 'Appointment reminder ⏰', `<p>${msg}</p>`);
    if (r.channel === 'SMS') res = await sendSMS(lead.phone, msg);
    if (r.channel === 'WHATSAPP') res = await sendWhatsApp(lead.phone, msg);
    await prisma.reminder.update({ where: { id: r.id }, data: { sent: true, delivered: res.delivered, sentAt: new Date() } });
  }
  return due.length;
}

// Agent 8 — No-Show Recovery
export async function startNoShowRecovery(appt) {
  const lead = appt.lead;
  const slots = await suggestSlots();
  const msg = `Hi ${lead.name || 'there'}, sorry we missed you! Let's reschedule. Available: ${slots.join(', ')}. Reply to rebook.`;
  await sendEmail(lead.email, "Let's reschedule 📅", `<p>${msg}</p>`);
  await sendSMS(lead.phone, msg);
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'NO_SHOW_RECOVERY', payload: JSON.stringify(slots), status: 'done' } });
}

async function suggestSlots() {
  const base = new Date(); const out = [];
  for (let d = 1; d <= 3; d++) {
    const s = new Date(base); s.setDate(base.getDate() + d); s.setHours(10, 0, 0, 0);
    out.push(format(s, 'EEE MMM d, h:mm a'));
  }
  return out;
}

// Agent 9 — Post-Appointment Follow-up
export async function postAppointmentFollowup(appt) {
  const lead = appt.lead;
  const text = await runPostAppointmentAgent(lead);
  await sendEmail(lead.email, 'How was your experience?', `<p>${text}</p>`);
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'POST_APPOINTMENT', payload: text, status: 'done' } });
}

// Agent 10 — Review Request + referral trigger
export async function requestReview(lead) {
  const text = await runReviewAgent(lead);
  const html = text
    .replace('{{google_link}}', process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/review')
    + `<br><a href="${process.env.FACEBOOK_REVIEW_URL || '#'}">Facebook</a> | <a href="${process.env.TRUSTPILOT_URL || '#'}">Trustpilot</a>`;
  await sendEmail(lead.email, 'Mind sharing your experience? 🌟', html);
  await prisma.lead.update({ where: { id: lead.id }, data: { reviewStatus: 'requested' } });
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'REVIEW', status: 'done' } });
}

// Referral (triggered when review completed)
export async function requestReferral(lead) {
  const msg = `Thanks for the review, ${lead.name || 'friend'}! Know someone who'd benefit? Refer them and you both get 10% off.`;
  await sendEmail(lead.email, 'Refer a friend, get rewarded 🎁', `<p>${msg}</p>`);
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'REFERRAL', status: 'done' } });
}

// Agent 11 — Retention (30 days inactive)
export async function runRetentionCampaign() {
  const cutoff = new Date(Date.now() - 30 * 86400000);
  const leads = await prisma.lead.findMany({
    where: { status: 'COMPLETED', lastActiveAt: { lte: cutoff } },
  });
  for (const lead of leads) {
    const already = await prisma.automationEvent.findFirst({
      where: { leadId: lead.id, type: 'RETENTION', createdAt: { gte: cutoff } },
    });
    if (already) continue;
    const text = await runRetentionAgent(lead);
    await sendEmail(lead.email, 'We miss you 👋', `<p>${text}</p>`);
    await runUpsell(lead); // Agent 12 chained
    await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'RETENTION', payload: text, status: 'done' } });
  }
  return leads.length;
}

// Agent 12 — Upsell
export async function runUpsell(lead) {
  const text = await runUpsellAgent(lead);
  await sendEmail(lead.email, 'Recommended for you 🚀', `<p>${text}</p>`);
  await prisma.automationEvent.create({ data: { leadId: lead.id, type: 'UPSELL', payload: text, status: 'done' } });
}
