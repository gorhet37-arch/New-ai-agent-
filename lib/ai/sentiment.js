import { chat } from './provider';
export async function analyzeSentiment(text) {
  const out = await chat([
    { role: 'system', content: 'Classify sentiment as positive, neutral, or negative. Reply with only that word.' },
    { role: 'user', content: text },
  ], { temperature: 0 });
  const s = (out || '').toLowerCase();
  if (s.includes('positive')) return 'positive';
  if (s.includes('negative')) return 'negative';
  return 'neutral';
}

export function detectIntent(text) {
  const t = text.toLowerCase();
  if (/book|schedule|appointment|demo|call/.test(t)) return 'booking';
  if (/price|cost|quote|budget/.test(t)) return 'pricing';
  if (/help|support|issue|problem/.test(t)) return 'support';
  if (/buy|purchase|sign up|get started/.test(t)) return 'purchase';
  return 'inquiry';
}
