import { chat } from './provider';

const SYSTEM = {
  welcome: `You are a warm, human, professional sales concierge for a business.
Goals: greet, detect intent, answer questions, handle objections, build trust, naturally guide toward giving name/email and booking. Keep replies concise (2-4 sentences), friendly, never robotic. Never invent prices—offer a tailored quote/call instead.`,
  capture: `You are a friendly assistant collecting lead info conversationally: name, email, phone, company, business type, service needed, budget, timeline. Ask ONE field at a time. Acknowledge each answer warmly.`,
  qualify: `You assess lead quality and suggest next best action.`,
  post: `You are a caring follow-up agent. Ask about their experience, if they need more help, and the next step. Empathetic and brief.`,
  review: `You craft a short, personalized, genuine review request mentioning the service they received.`,
  retention: `You re-engage a customer 30 days later: check in, offer support, propose value. Warm, not salesy.`,
  upsell: `You recommend relevant additional services/premium/subscription based on history. Helpful, consultative.`,
};

export async function runWelcomeAgent(history, lead) {
  const messages = [
    { role: 'system', content: SYSTEM.welcome +
      (lead?.name ? ` The visitor's name is ${lead.name}.` : '') },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];
  return chat(messages, { temperature: 0.8 });
}

export async function runCaptureAgent(history, missingFields) {
  const messages = [
    { role: 'system', content: SYSTEM.capture +
      ` Still need: ${missingFields.join(', ')}.` },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];
  return chat(messages, { temperature: 0.6 });
}

export async function runReviewAgent(lead) {
  return chat([
    { role: 'system', content: SYSTEM.review },
    { role: 'user', content: `Customer ${lead.name || 'there'} received "${lead.serviceNeeded || 'our service'}". Write a 2-sentence review request with placeholders {{google_link}}.` },
  ], { temperature: 0.7 });
}

export async function runRetentionAgent(lead) {
  return chat([
    { role: 'system', content: SYSTEM.retention },
    { role: 'user', content: `Re-engage ${lead.name || 'customer'} who used "${lead.serviceNeeded || 'our service'}" 30 days ago.` },
  ], { temperature: 0.7 });
}

export async function runUpsellAgent(lead) {
  return chat([
    { role: 'system', content: SYSTEM.upsell },
    { role: 'user', content: `Customer history: service "${lead.serviceNeeded}", budget "${lead.budget}", industry "${lead.industry}". Recommend 2-3 upsell options.` },
  ], { temperature: 0.7 });
}

export async function runPostAppointmentAgent(lead) {
  return chat([
    { role: 'system', content: SYSTEM.post },
    { role: 'user', content: `Follow up with ${lead.name || 'customer'} after their appointment.` },
  ], { temperature: 0.7 });
}
