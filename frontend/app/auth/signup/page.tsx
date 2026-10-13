'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetcher } from '@/lib/api';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'brand' | 'creator'>('creator');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetcher('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>Create Account</h2>
        {error && <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Password</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px' }}>
              <option value="creator">Creator</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '0.85rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Sign Up</button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', textAlign: 'center', color: '#94a3b8' }}>
          Already registered? <Link href="/auth/login" style={{ color: '#818cf8' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
