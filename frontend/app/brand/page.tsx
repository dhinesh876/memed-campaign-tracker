'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetcher } from '@/lib/api';

export default function BrandDashboard() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [totalBudget, setTotalBudget] = useState('');
  const [milestones, setMilestones] = useState([{ views: '', payout: '' }]);
  const [error, setError] = useState('');

  const loadCampaigns = async () => {
    try {
      const data = await fetcher('/campaigns/brand');
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== 'brand') { router.replace('/auth/login'); return; }
    loadCampaigns();
  }, [ready, user]);

  if (!ready || !user || user.role !== 'brand') return null;

  const addMilestoneRow = () => {
    setMilestones([...milestones, { views: '', payout: '' }]);
  };

  const updateMilestone = (index: number, field: 'views' | 'payout', value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedMilestones = milestones.map(m => ({
        views: Number(m.views),
        payout: Number(m.payout),
      }));

      await fetcher('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name,
          platform,
          totalBudget: Number(totalBudget),
          milestones: formattedMilestones,
        }),
      });

      setName('');
      setTotalBudget('');
      setMilestones([{ views: '', payout: '' }]);
      loadCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700 }}>Brand Portal</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem' }}>Campaign Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Account: {user?.name}</p>
        </div>
        <button onClick={logout} style={{ padding: '0.5rem 1.1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', cursor: 'pointer' }}>Disconnect</button>
      </header>

      {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Create New Campaign</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Campaign Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Total Budget (₹)</label>
              <input type="number" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>Milestone Reward Ladder</label>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.6rem' }}>
                <input type="number" placeholder="Views" value={m.views} onChange={e => updateMilestone(i, 'views', e.target.value)} required style={{ flex: 1, padding: '0.7rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                <input type="number" placeholder="Payout ₹" value={m.payout} onChange={e => updateMilestone(i, 'payout', e.target.value)} required style={{ flex: 1, padding: '0.7rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
              </div>
            ))}
            <button type="button" onClick={addMilestoneRow} style={{ color: '#818cf8', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Tier</button>
          </div>

          <button type="submit" style={{ padding: '0.85rem 1.6rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-start' }}>Publish Campaign</button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Active Campaigns</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {campaigns.map(c => (
            <div key={c._id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>{c.platform}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div>Spent: <strong style={{ color: '#f87171' }}>₹{c.spentBudget.toLocaleString()}</strong></div>
                <div>Remaining: <strong style={{ color: '#34d399' }}>₹{c.remainingBudget.toLocaleString()}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
