'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Meme&apos;d Campaign Payout Tracker</h1>
      <p style={{ color: '#94a3b8', maxWidth: '440px', marginBottom: '2.5rem' }}>Creator rewards marketplace with budget caps and milestone tiers.</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/auth/login" style={{ padding: '0.8rem 1.8rem', background: '#6366f1', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
        <Link href="/auth/signup" style={{ padding: '0.8rem 1.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>Create Account</Link>
      </div>
    </main>
  );
}
