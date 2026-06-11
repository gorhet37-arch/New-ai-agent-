'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function getCsrf() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1] || '';
}

function BookInner() {
  const params = useSearchParams();
  const leadId = params.get('lead');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tz, setTz] = useState('UTC');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(null);
  const [error, setError] = useState('');

  // Timezone detection (Agent 5 requirement)
  useEffect(() => {
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'); } catch { setTz('UTC'); }
  }, []);

  async function loadSlots() {
    setLoading(true); setError(''); setSelected(null);
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      if (!res.ok) throw new Error('Failed to load availability');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { loadSlots(); /* eslint-disable-next-line */ }, [date]);

  async function confirm() {
    if (!selected) return;
    if (!leadId) { setError('Missing lead reference. Please start from the chat.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ leadId, startTime: selected, durationMin: 30, timezone: tz, location: 'Video Call' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBooked(data.appointment);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">You're booked!</h1>
          <p style={{ color: 'var(--muted)' }} className="mb-4">
            {new Date(booked.startTime).toLocaleString('en-US', { timeZone: tz })}
          </p>
          <a href={booked.meetingLink} target="_blank" rel="noreferrer" className="btn inline-block">Join Meeting Link</a>
          <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>A confirmation has been sent via email, SMS & WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-1">Book Your Appointment</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Detected timezone: <b>{tz}</b></p>

        <label className="block text-sm mb-1">Select date</label>
        <input
          type="date"
          className="input mb-5"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={e => setDate(e.target.value)}
        />

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <label className="block text-sm mb-2">Available times</label>
        {loading ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading slots…</div>
        ) : slots.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>No slots available for this date. Try another day.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {slots.map(s => {
              const label = new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz });
              return (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`px-2 py-2 rounded-lg border text-sm ${selected === s ? 'bg-indigo-500 text-white border-indigo-500' : ''}`}
                  style={selected === s ? {} : { borderColor: 'var(--border)' }}
                >{label}</button>
              );
            })}
          </div>
        )}

        <button className="btn w-full" disabled={!selected || loading} onClick={confirm}>
          {loading ? 'Booking…' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <BookInner />
    </Suspense>
  );
}
