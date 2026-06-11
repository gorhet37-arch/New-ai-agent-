'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

function getCsrf() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1] || '';
}

const statusColor = {
  SCHEDULED: 'bg-blue-500', CONFIRMED: 'bg-emerald-500', COMPLETED: 'bg-indigo-500',
  NO_SHOW: 'bg-red-500', CANCELLED: 'bg-slate-500', RESCHEDULED: 'bg-amber-500',
};

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppts(data.appointments || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    setError('');
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Update failed');
      }
      await load();
    } catch (e) { setError(e.message); }
  }

  const filtered = filter ? appts.filter(a => a.status === filter) : appts;

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <select className="input sm:w-48" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(statusColor).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <div className="card p-3 mb-4 text-red-500 border-red-500/40">{error}</div>}

        {loading ? (
          <div className="card p-10 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: 'var(--muted)' }}>No appointments yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: 'var(--muted)' }}>
                  {['Lead', 'When', 'Timezone', 'Location', 'Status', 'Reminders', 'Actions'].map(h => (
                    <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const sent = (a.reminders || []).filter(r => r.sent).length;
                  const total = (a.reminders || []).length;
                  return (
                    <tr key={a.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-3">
                        <div className="font-medium">{a.lead?.name || 'Unknown'}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{a.lead?.email || '—'}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(a.startTime).toLocaleString('en-US', { timeZone: a.timezone || 'UTC' })}
                      </td>
                      <td className="p-3">{a.timezone}</td>
                      <td className="p-3">
                        {a.location}
                        {a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noreferrer" className="block text-xs text-indigo-400 underline">link</a>}
                      </td>
                      <td className="p-3">
                        <span className={`text-white text-xs px-2 py-0.5 rounded-full ${statusColor[a.status] || 'bg-slate-500'}`}>{a.status}</span>
                      </td>
                      <td className="p-3 text-xs">{sent}/{total} sent</td>
                      <td className="p-3">
                        <select
                          className="input text-xs py-1"
                          value=""
                          onChange={e => { if (e.target.value) updateStatus(a.id, e.target.value); }}
                        >
                          <option value="">Set status…</option>
                          <option value="CONFIRMED">Confirm</option>
                          <option value="COMPLETED">Mark Completed</option>
                          <option value="NO_SHOW">Mark No-Show</option>
                          <option value="CANCELLED">Cancel</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
