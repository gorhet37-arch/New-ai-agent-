const cron = require('node-cron');
require('dotenv').config();
// Use ts-less dynamic import of compiled lib or run via next runtime
const { dispatchDueReminders, runRetentionCampaign } = require('../lib/automation');

console.log('⏰ ConvertAI automation worker started');

// Every minute: send due reminders
cron.schedule('* * * * *', async () => {
  try { const n = await dispatchDueReminders(); if (n) console.log(`Sent ${n} reminders`); }
  catch (e) { console.error('reminder error', e); }
});

// Daily 9am: retention + upsell campaign
cron.schedule('0 9 * * *', async () => {
  try { const n = await runRetentionCampaign(); console.log(`Retention: ${n} customers`); }
  catch (e) { console.error('retention error', e); }
});
