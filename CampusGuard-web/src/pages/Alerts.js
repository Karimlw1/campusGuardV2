import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Shield, Plus } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('cg_token')}`,
});

const TYPE_LABELS = {
  invalid_qr:    { label: 'Invalid QR',    cls: 'danger' },
  blacklisted:   { label: 'Blacklisted',   cls: 'danger' },
  overstay:      { label: 'Overstay',      cls: 'warn'   },
  repeated_fail: { label: 'Repeated Fail', cls: 'warn'   },
  manual:        { label: 'Manual Report', cls: 'warn'   },
};

const GATES = [
  { id: 1, name: 'Main Gate' },
  { id: 2, name: 'North Gate' },
  { id: 3, name: 'South Gate' },
];

export default function Alerts() {
  const [alertList, setAlertList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ type: 'manual', gate_id: 1, description: '' });
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 20000);
    return () => clearInterval(t);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res  = await fetch(`${BASE}/alerts`, { headers: authHeader() });
      const data = await res.json();
      if (Array.isArray(data)) setAlertList(data);
    } catch {}
    setLoading(false);
  };

  const handleResolve = async (id) => {
    try {
      await fetch(`${BASE}/alerts/${id}/resolve`, { method: 'PATCH', headers: authHeader() });
      setAlertList(list => list.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.description.trim()) { alert('Please enter a description.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/alerts`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ type: form.type, gate_id: form.gate_id, description: form.description }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertList(list => [data, ...list]);
      } else {
        alert(data.detail || 'Failed to raise alert');
      }
    } catch { alert('Network error — check backend connection.'); }
    setSaving(false);
    setShowModal(false);
    setForm({ type: 'manual', gate_id: 1, description: '' });
  };

  const unresolved = alertList.filter(a => !a.resolved);
  const resolved   = alertList.filter(a =>  a.resolved);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Security Alerts</div>
          <div className="page-subheading">{unresolved.length} unresolved alert{unresolved.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="flex-row">
          <div className="flex-row">
            <Shield size={16} color={unresolved.length > 0 ? 'var(--danger)' : 'var(--success)'} />
            <span style={{ fontSize: 13, color: unresolved.length > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
              {unresolved.length} Active
            </span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Raise Alert
          </button>
        </div>
      </div>

      {/* Unresolved */}
      {loading ? <div className="spinner" /> : unresolved.length === 0 ? (
        <div className="card mb-16" style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle size={40} color="var(--success)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: 15 }}>All clear — no active alerts</div>
          <div style={{ color: 'var(--grey-500)', fontSize: 13, marginTop: 4 }}>Use "Raise Alert" to log a security incident.</div>
        </div>
      ) : (
        <div className="card mb-16">
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--danger)' }}>⚠ Unresolved Alerts</div>
          </div>
          {unresolved.map(a => {
            const t = TYPE_LABELS[a.type] || { label: a.type, cls: 'danger' };
            return (
              <div key={a.id} className={`alert-item ${t.cls}`} style={{ marginBottom: 10 }}>
                <AlertTriangle size={18} color={t.cls === 'danger' ? 'var(--danger)' : 'var(--warn)'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey-500)', marginTop: 2 }}>
                    {a.gate} &nbsp;·&nbsp; {a.timestamp}
                  </div>
                </div>
                <span className={`badge badge-${t.cls}`}>{t.label}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleResolve(a.id)}>
                  <CheckCircle size={13} /> Resolve
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved */}
      <div className="card">
        <div className="card-header"><div className="card-title">Resolved</div></div>
        {resolved.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: 24, fontSize: 13 }}>No resolved alerts yet.</div>
        ) : resolved.map(a => {
          const t = TYPE_LABELS[a.type] || { label: a.type, cls: 'danger' };
          return (
            <div key={a.id} className="alert-item info" style={{ marginBottom: 8, opacity: 0.7 }}>
              <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{a.description}</div>
                <div style={{ fontSize: 12, color: 'var(--grey-500)' }}>{a.gate} · {a.timestamp}</div>
              </div>
              <span className="badge badge-success">Resolved</span>
            </div>
          );
        })}
      </div>

      {/* Raise Alert Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🚨 Raise Security Alert</div>

            <div className="form-group">
              <label className="form-label">Alert Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Gate / Location</label>
              <select className="form-select" value={form.gate_id} onChange={e => setForm(f => ({ ...f, gate_id: Number(e.target.value) }))}>
                {GATES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Describe the security incident in detail…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleCreate} disabled={saving || !form.description.trim()}>
                {saving ? 'Raising…' : '🚨 Raise Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
