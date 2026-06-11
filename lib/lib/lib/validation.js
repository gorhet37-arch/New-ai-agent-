import { z } from 'zod';

export const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRx = /^\+?[0-9\s\-()]{7,20}$/;

export const leadSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().regex(emailRx, 'Invalid email').optional(),
  phone: z.string().regex(phoneRx, 'Invalid phone').optional(),
  company: z.string().max(160).optional(),
  businessType: z.string().max(120).optional(),
  serviceNeeded: z.string().max(200).optional(),
  budget: z.string().max(60).optional(),
  timeline: z.string().max(60).optional(),
  source: z.string().max(60).optional(),
});

export const apptSchema = z.object({
  leadId: z.string().min(1),
  startTime: z.string(),
  durationMin: z.number().int().min(15).max(480).default(30),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
});

export function validate(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) return { ok: false, errors: r.error.flatten().fieldErrors };
  return { ok: true, data: r.data };
}
