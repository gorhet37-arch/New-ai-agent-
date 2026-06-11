'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
const tempColor = { HOT: 'bg-red-500', WARM: 'bg-amber-500', COLD: 'bg-blue-500' };
export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { fetch('/api/leads' + (filter ? `?temperature=${filter}` : '')).then(r => r.json()).then(d => setLeads(d.leads || [])); }, [filter]);
  return (
    <div className="min-h-screen"><Nav />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">CRM — Leads</h1>
          <select className="input w-40" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option>
          </select>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: 'var(--muted)' }}>
              {['Name','Email','Company','Service','Score','Temp','Status','Revenue'].map(h => <th key={h} className="p-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3">{l.name || '—'}</td><td className="p-3">{l.email || '—'}</td>
                  <td className="p-3">{l.company || '—'}</td><td className="p-3">{l.serviceNeeded || '—'}</td>
                  <td className="p-3 font-bold">{l.score}</td>
                  <td className="p-3"><span className={`text-white text-xs px-2 py-0.5 rounded-full ${tempColor[l.temperature]}`}>{l.temperature}</span></td>
                  <td className="p-3">{l.status}</td><td className="p-3">${l.revenueGenerated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
