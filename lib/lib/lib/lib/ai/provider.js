import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Falls back to deterministic logic when no API key (keeps system functional in dev)
export async function chat(messages, { temperature = 0.7, json = false } = {}) {
  if (client) {
    const res = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return res.choices[0].message.content;
  }
  // Deterministic fallback
  return fallback(messages, json);
}

function fallback(messages, json) {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  if (json) return JSON.stringify({ note: 'fallback', text: last });
  if (/price|cost|how much/.test(last))
    return "Great question! Pricing depends on your needs. May I grab your name and email so I can send a tailored quote and book a quick call?";
  if (/book|appointment|schedule|meeting/.test(last))
    return "I'd love to set that up! What day works best for you this week?";
  if (/hi|hello|hey/.test(last))
    return "Hi there! 👋 Welcome — I'm here to help you find the right solution. What brings you in today?";
  return "Thanks for sharing that! To help you best, could I get your name and the service you're interested in?";
}
