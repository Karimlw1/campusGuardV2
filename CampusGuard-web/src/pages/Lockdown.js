import { useState, useEffect } from 'react';
import { Shield, ShieldOff, AlertTriangle, Clock } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

export default function Lockdown() {
  const [status, setStatus]   = useState({ active: false, reason: null, since: null });
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 10000); return () => clearInterval(t); }, []);

  const fetchStatus = async () => {
    try { const r = await fetch(`${BASE}/lockdown/status`, { headers: authHeader() }); setStatus(await r.json()); } catch {}
  };

  const handleToggle = async () => {
    if (!status.active && !confirm) { setConfirm(true); return; }
    setSaving(true);
    try {
      await fetch(`${BASE}/lockdown`, { method: 'POST', headers: authHeader(),
        body: JSON.stringify({ active: !status.active, reason: reason || (status.active ? 'Lockdown lifted' : 'Emergency') }) });
      await fetchStatus();
      setConfirm(false); setReason('');
    } catch { alert('Failed to update lockdown'); }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Emergency Lockdown</div>
          <div className="page-subheading">Instantly deny all campus gate access</div>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ borderRadius: 12, padding: '32px 36px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24,
        background: status.active ? 'var(--danger)' : 'var(--green-pale)',
        border: `2px solid ${status.active ? '#8B1F1F' : 'rgba(46,125,82,0.25)'}`,
        animation: status.active ? 'pulse 2s infinite' : 'none' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: status.active ? 'rgba(255,255,255,0.15)' : 'var(--green-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {status.active ? <ShieldOff size={28} color="white" /> : <Shield size={28} color="white" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Fraunces, serif', color: status.active ? 'white' : 'var(--green)',
            letterSpacing: '-0.01em' }}>
            {status.active ? '🔴 LOCKDOWN ACTIVE' : '🟢 Campus Access Normal'}
          </div>
          {status.active && status.reason && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Reason: {status.reason}</div>
          )}
          {status.active && status.since && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> Active since {new Date(status.since).toLocaleTimeString()}
            </div>
          )}
          {!status.active && <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>All gates operating normally</div>}
        </div>
        {!confirm && (
          <button onClick={handleToggle} disabled={saving}
            style={{ padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
              background: status.active ? 'white' : 'var(--danger)', color: status.active ? 'var(--danger)' : 'white', transition: 'all 0.15s' }}>
            {saving ? 'Updating…' : status.active ? 'Lift Lockdown' : '🔴 Activate Lockdown'}
          </button>
        )}
      </div>

      {/* Confirmation panel */}
      {confirm && !status.active && (
        <div className="card" style={{ border: '2px solid var(--danger)', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
            <AlertTriangle size={22} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger)', fontFamily: 'Fraunces, serif' }}>Confirm Emergency Lockdown</div>
              <div style={{ fontSize: 13, color: 'var(--muted-dark)', marginTop: 4 }}>
                This will immediately deny entry at ALL gates. Guards will be notified via the alerts system.
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason for lockdown *</label>
            <input className="form-input" placeholder="e.g. Security threat reported at main gate"
              value={reason} onChange={e => setReason(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
            <button onClick={handleToggle} disabled={!reason.trim() || saving}
              style={{ padding: '9px 20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
              {saving ? 'Activating…' : '🔴 Confirm Lockdown'}
            </button>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>What happens during lockdown</div>
          {['All gate QR scans are denied instantly', 'Guards see a red lockdown banner on their screens',
            'An alert is created and visible to all guards', 'No entries or exits are logged until lifted',
            'Admin must manually lift the lockdown'].map(item => (
            <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule)', fontSize: 13, color: 'var(--muted-dark)', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>When to use lockdown</div>
          {['Security threat or suspicious person on campus', 'Medical emergency requiring campus isolation',
            'Civil unrest or external threat reported', 'VIP visit requiring restricted movement',
            'System maintenance requiring gate suspension'].map(item => (
            <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule)', fontSize: 13, color: 'var(--muted-dark)', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.92} }`}</style>
    </div>
  );
}
