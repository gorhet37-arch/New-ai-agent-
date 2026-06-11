'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

function getCsrf() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1] || '';
}

const badge = {
  none: 'bg-slate-500', requested: 'bg-amber-500', completed: 'bg-emerald-500',
};

export default function Reviews() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueInput, setRevenueInput] = useState({});

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      // Only show leads relevant to reviews (completed or already in review flow)
      const list = (data.leads || []).filter(l => l.status === 'COMPLETED' || l.reviewStatus !== 'none');
      setLeads(list);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markCompleted(leadId) {
    setError('');
    try {
      const res = await fetch('/api/reviews/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ leadId, revenue: parseFloat(revenueInput[leadId]) || 0 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed');
      }
      await load();
    } catch (e) { setError(e.message); }
  }

  const stats = {
    requested: leads.filter(l => l.reviewStatus === 'requested').length,
    completed: leads.filter(l => l.reviewStatus === 'completed').length,
    rate: leads.length ? ((leads.filter(l => l.reviewStatus === 'completed').length / leads.length) * 100).toFixed(0) : 0,
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Reviews</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><div className="text-sm" style={{ color: 'var(--muted)' }}>Requested</div><div className="text-2xl font-bold">{stats.requested}</div></div>
          <div className="card p-4"><div className="text-sm" style={{ color: 'var(--muted)' }}>Completed</div><div className="text-2xl font-bold">{stats.completed}</div></div>
          <div className="card p-4"><div className="text-sm" style={{ color: 'var(--muted)' }}>Completion Rate</div><div className="text-2xl font-bold">{stats.rate}%</div></div>
        </div>

        {error && <div className="card p-3 mb-4 text-red-500 border-red-500/40">{error}</div>}

        {loading ? (
          <div className="card p-10 text-center">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: 'var(--muted)' }}>No review activity yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: 'var(--muted)' }}>
                  {['Customer', 'Service', 'Review Status', 'Revenue', 'Action'].map(h => <th key={h} className="p-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-3">
                      <div className="font-medium">{l.name || 'Unknown'}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{l.email || '—'}</div>
                    </td>
                    <td className="p-3">{l.serviceNeeded || '—'}</td>
                    <td className="p-3"><span className={`text-white text-xs px-2 py-0.5 rounded-full ${badge[l.reviewStatus] || 'bg-slate-500'}`}>{l.reviewStatus}</span></td>
                    <td className="p-3">${l.revenueGenerated}</td>
                    <td className="p-3">
                      {l.reviewStatus !== 'completed' ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="input w-24 text-xs py-1"
                            placeholder="Revenue $"
                            value={revenueInput[l.id] || ''}
                            onChange={e => setRevenueInput(s => ({ ...s, [l.id]: e.target.value }))}
                          />
                          <button className="btn text-xs py-1" onClick={() => markCompleted(l.id)}>Mark Reviewed</button>
                        </div>
                      ) : <span className="text-xs" style={{ color: 'var(--muted)' }}>✓ Referral sent</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
