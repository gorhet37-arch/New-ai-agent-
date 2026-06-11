// Lead enrichment: derives public business info from email domain.
export async function enrichLead(lead) {
  const out = { website: null, businessSize: null, industry: null, socialProfiles: null };
  const domain = lead.email?.split('@')[1];
  const freeMail = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com'];
  if (domain && !freeMail.includes(domain)) {
    out.website = `https://${domain}`;
    out.socialProfiles = JSON.stringify({
      linkedin: `https://www.linkedin.com/company/${domain.split('.')[0]}`,
    });
  }
  // Heuristic sizing from businessType
  const bt = (lead.businessType || '').toLowerCase();
  if (/enterprise|corp|inc/.test(bt)) out.businessSize = '500+';
  else if (/agency|firm|company/.test(bt)) out.businessSize = '50-200';
  else if (/startup|solo|freelance/.test(bt)) out.businessSize = '1-10';
  else out.businessSize = '10-50';
  out.industry = lead.businessType || lead.industry || 'General';
  return out;
}
