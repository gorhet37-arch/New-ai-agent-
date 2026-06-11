import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null;

let twilio = null;
if (process.env.TWILIO_SID) {
  const T = require('twilio');
  twilio = T(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

export async function sendEmail(to, subject, html) {
  if (!to) return { delivered: false };
  if (!transporter) { console.log(`[EMAIL→${to}] ${subject}`); return { delivered: true, simulated: true }; }
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  return { delivered: true };
}

export async function sendSMS(to, body) {
  if (!to) return { delivered: false };
  if (!twilio) { console.log(`[SMS→${to}] ${body}`); return { delivered: true, simulated: true }; }
  await twilio.messages.create({ to, from: process.env.TWILIO_FROM, body });
  return { delivered: true };
}

export async function sendWhatsApp(to, body) {
  if (!to) return { delivered: false };
  if (!twilio) { console.log(`[WA→${to}] ${body}`); return { delivered: true, simulated: true }; }
  await twilio.messages.create({ to: `whatsapp:${to}`, from: `whatsapp:${process.env.TWILIO_WA_FROM}`, body });
  return { delivered: true };
}
