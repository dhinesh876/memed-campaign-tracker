'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetcher } from '@/lib/api';

export default function CreatorDashboard() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [liveCampaigns, setLiveCampaigns] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<{ totalEarnings: number; submissions: any[] }>({
    totalEarnings: 0,
    submissions: [],
  });
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [updateId, setUpdateId] = useState('');
  const [viewCount, setViewCount] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [campaigns, earnings] = await Promise.all([
        fetcher('/campaigns/live'),
        fetcher('/submissions/creator'),
      ]);
      setLiveCampaigns(campaigns);
      setEarningsData(earnings);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== 'creator') { router.replace('/auth/login'); return; }
    loadData();
  }, [ready, user]);

  if (!ready || !user || user.role !== 'creator') return null;

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetcher('/submissions', {
        method: 'POST',
        body: JSON.stringify({ campaignId: selectedCampaign, postUrl }),
      });
      setPostUrl('');
      loadData();
      setMessage('Post submitted successfully');
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleUpdateViews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetcher(`/submissions/${updateId}/views`, {
        method: 'PATCH',
        body: JSON.stringify({ views: Number(viewCount) }),
      });
      setViewCount('');
      loadData();
      setMessage('Views updated and payout recalculated (concurrency-safe)');
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Creator Space</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem' }}>Earnings & Submissions</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} style={{ padding: '0.5rem 1.1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', cursor: 'pointer' }}>Disconnect</button>
      </header>

      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '2rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>Total Earned Payout</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>₹{earningsData.totalEarnings.toLocaleString()}</div>
        </div>
        <div style={{ fontSize: '2.5rem' }}>💰</div>
      </div>

      {message && <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#c7d2fe', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Submit Post Link</h2>
          <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
              <option value="">-- Choose Campaign --</option>
              {liveCampaigns.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.platform}) - ₹{(c.remainingBudget ?? 0).toLocaleString()} left</option>
              ))}
            </select>
            <input type="url" placeholder="https://instagram.com/p/..." value={postUrl} onChange={e => setPostUrl(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            <button type="submit" style={{ padding: '0.8rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Submit Link</button>
          </form>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Simulate View Counter</h2>
          <form onSubmit={handleUpdateViews} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select value={updateId} onChange={e => setUpdateId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
              <option value="">-- Choose Submission --</option>
              {earningsData.submissions.map(s => (
                <option key={s._id} value={s._id}>{s.postUrl} ({s.views} views)</option>
              ))}
            </select>
            <input type="number" placeholder="New view count" value={viewCount} onChange={e => setViewCount(e.target.value)} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
            <button type="submit" style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Update Views</button>
          </form>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Submissions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Campaign</th>
                <th style={{ padding: '0.75rem' }}>Link</th>
                <th style={{ padding: '0.75rem' }}>Views</th>
                <th style={{ padding: '0.75rem' }}>Payout</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {earningsData.submissions.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem' }}>{s.campaignId?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#818cf8' }}>{s.postUrl}</td>
                  <td style={{ padding: '0.75rem' }}>{s.views.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', color: '#34d399', fontWeight: 700 }}>₹{s.currentPayout.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {s.flagged ? (
                      <span title={s.flagReason} style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>🚩 Spike</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
