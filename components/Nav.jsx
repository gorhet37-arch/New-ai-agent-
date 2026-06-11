'use client';
import { useState, useEffect } from 'react';
const links = [['Analytics','/dashboard'],['CRM','/dashboard/crm'],['Appointments','/dashboard/appointments'],['Reviews','/dashboard/reviews'],['Team','/dashboard/team']];
export default function Nav() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  function toggle() { const d = document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', d ? 'dark' : 'light'); setDark(d); }
  return (
    <nav className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto flex items-center gap-1 p-3 overflow-x-auto">
        <b className="mr-4">ConvertAI</b>
        {links.map(([l, h]) => <a key={h} href={h} className="px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 whitespace-nowrap">{l}</a>)}
        <button onClick={toggle} className="ml-auto px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>{dark ? '☀️' : '🌙'}</button>
      </div>
    </nav>
  );
}
