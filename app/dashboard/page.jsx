'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Nav from '@/components/Nav';

const COLORS = { HOT: '#ef4444', WARM: '#f59e0b', COLD: '#3b82f6' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="p-10">Loading…</div>;
  const k = data.kpis;
  const cards = [
    ['Visitors', k.visitors], ['Leads', k.leads], ['Qualified', k.qualified],
    ['Booked', k.booked], ['No-Shows', k.noShows], ['Conversions', k.conversions],
    ['Revenue', `$${k.revenue}`], ['Reviews', k.reviews],
    ['Conv. Rate', `${k.conversionRate}%`], ['No-Show Rate', `${k.noShowRate}%`],
  ];
  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {cards.map(([label, val]) => (
            <div key={label} className="card p-4">
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{label}</div>
              <div className="text-2xl font-bold">{val}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Conversion Funnel</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.funnel}><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#6366f1" radius={[6,6,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Lead Temperature</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={data.temperature} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.temperature.map((e,i) => <Cell key={i} fill={COLORS[e.name] || '#888'} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
