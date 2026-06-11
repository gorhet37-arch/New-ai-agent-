'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

function getCsrf() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1] || '';
}

const roleColor = { ADMIN: 'bg-red-500', MANAGER: 'bg-indigo-500', AGENT: 'bg-emerald-500', VIEWER: 'bg-slate-500' };

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/team');
      if (res.status === 403) throw new Error('You do not have permission to view the team.');
      if (!res.ok) throw new Error('Failed to load team');
      const data = await res.json();
      setMembers(data.users || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addMember(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (data.errors && JSON.stringify(data.errors)) || 'Failed to add member');
      setForm({ name: '', email: '', password: '', role: 'AGENT' });
      await load();
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  async function removeMember(id) {
    setError('');
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrf() },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to remove');
      }
      await load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Team</h1>

        {error && <div className="card p-3 mb-4 text-red-500 border-red-500/40">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {loading ? (
              <div className="card p-10 text-center">Loading…</div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--muted)' }}>
                      {['Name', 'Email', 'Role', 'Joined', ''].map(h => <th key={h} className="p-3">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="p-3 font-medium">{m.name}</td>
                        <td className="p-3">{m.email}</td>
                        <td className="p-3"><span className={`text-white text-xs px-2 py-0.5 rounded-full ${roleColor[m.role]}`}>{m.role}</span></td>
                        <td className="p-3 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          {m.role !== 'ADMIN' && (
                            <button className="text-red-500 text-xs hover:underline" onClick={() => removeMember(m.id)}>Remove</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-5 h-fit">
            <h3 className="font-semibold mb-3">Add Member</h3>
            <form onSubmit={addMember} className="space-y-3">
              <input className="input" placeholder="Full name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input" type="email" placeholder="Email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <input className="input" type="password" placeholder="Temp password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {['ADMIN', 'MANAGER', 'AGENT', 'VIEWER'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn w-full" disabled={saving}>{saving ? 'Adding…' : 'Add Member'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
