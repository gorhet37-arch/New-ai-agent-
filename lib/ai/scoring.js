// Deterministic, explainable BANT-style scoring 0-100
export function scoreLead(lead) {
  let score = 0;
  const factors = {};

  // Budget (0-30)
  const budget = (lead.budget || '').toLowerCase();
  let b = 5;
  if (/50k|100k|enterprise|unlimited/.test(budget)) b = 30;
  else if (/10k|20k|25k|high/.test(budget)) b = 24;
  else if (/5k|medium/.test(budget)) b = 16;
  else if (/1k|low|small/.test(budget)) b = 8;
  factors.budget = b; score += b;

  // Need / Service clarity (0-25)
  let n = lead.serviceNeeded ? 18 : 4;
  if (lead.serviceNeeded && lead.serviceNeeded.length > 15) n = 25;
  factors.need = n; score += n;

  // Urgency / Timeline (0-25)
  const tl = (lead.timeline || '').toLowerCase();
  let u = 5;
  if (/asap|immediately|now|this week|urgent/.test(tl)) u = 25;
  else if (/month|30 days|soon/.test(tl)) u = 18;
  else if (/quarter|3 month/.test(tl)) u = 10;
  factors.urgency = u; score += u;

  // Authority / Company (0-10)
  let a = lead.company ? 7 : 2;
  if (/ceo|founder|owner|director|head|vp/i.test(lead.serviceNeeded || '')) a = 10;
  factors.authority = a; score += a;

  // Contact completeness (0-10)
  let c = 0;
  if (lead.email) c += 5;
  if (lead.phone) c += 5;
  factors.contact = c; score += c;

  score = Math.min(100, Math.round(score));
  const temperature = score >= 80 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD';
  return { score, temperature, factors };
}
