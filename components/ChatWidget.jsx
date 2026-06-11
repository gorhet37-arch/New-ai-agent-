'use client';
import { useState, useRef, useEffect } from 'react';

function getCsrf() {
  return document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1];
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: "Hi! 👋 I'm your AI assistant. What can I help you with today?" }]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(null);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight); }, [msgs]);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input; setInput('');
    setMsgs(m => [...m, { role: 'user', content: text }]); setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() || 'dev' },
        body: JSON.stringify({ message: text, leadId }),
      });
      const data = await res.json();
      setLeadId(data.leadId);
      setMeta({ score: data.score, temperature: data.temperature, readyToBook: data.readyToBook });
      setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch { setMsgs(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]); }
    setLoading(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="card w-[92vw] max-w-sm h-[70vh] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div><b>AI Assistant</b>{meta.temperature && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white">{meta.temperature} · {meta.score}</span>}</div>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'card'}`}>{m.content}</div>
              </div>
            ))}
            {loading && <div className="text-xs" style={{ color: 'var(--muted)' }}>typing…</div>}
          </div>
          {meta.readyToBook && <a href={`/book?lead=${leadId}`} className="btn mx-4 mb-2 text-center">📅 Book Appointment</a>}
          <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
            <input className="input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message…" />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn rounded-full w-16 h-16 text-2xl shadow-xl">💬</button>
      )}
    </div>
  );
}
