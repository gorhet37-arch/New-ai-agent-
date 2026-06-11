import ChatWidget from '@/components/ChatWidget';
export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <b className="text-xl">ConvertAI</b>
        <a href="/dashboard" className="btn">Dashboard</a>
      </nav>
      <section className="max-w-3xl mx-auto text-center py-24 px-4">
        <h1 className="text-5xl font-bold mb-4">Turn Visitors Into Customers — Automatically</h1>
        <p className="text-lg mb-8" style={{ color: 'var(--muted)' }}>13 AI agents handle lead capture, qualification, booking, reminders, reviews, retention & upsell — 24/7.</p>
        <a href="/dashboard" className="btn text-lg px-8 py-3">Get Started</a>
      </section>
      <ChatWidget />
    </main>
  );
}
