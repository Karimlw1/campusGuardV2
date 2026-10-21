import { useState, useEffect } from 'react';
import { Plus, CheckCircle } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('cg_token')}`,
});

const EMPTY   = { name: '', id_number: '', reason: '', host: '', expected_exit: '' };
const REASONS = ['Meeting with lecturer', 'Document collection', 'Student visit', 'Job interview', 'Delivery', 'Official business', 'Other'];

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchVisitors(); }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/visitors`, { headers: authHeader() });
      const data = await res.json();
      if (Array.isArray(data)) setVisitors(data);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.reason || !form.host) { alert('Name, reason and host are required.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/visitors`, { method: 'POST', headers: authHeader(), body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) setVisitors(v => [data, ...v]);
      else alert(data.detail || 'Error logging visitor');
    } catch { alert('Network error'); }
    setSaving(false); setModal(false); setForm(EMPTY);
  };

  const handleCheckout = async (id) => {
    try {
      await fetch(`${BASE}/visitors/${id}/checkout`, { method: 'PATCH', headers: authHeader() });
      setVisitors(v => v.map(x => x.id === id ? { ...x, checked_out: true } : x));
    } catch {}
  };

  const active   = visitors.filter(v => !v.checked_out);
  const departed = visitors.filter(v =>  v.checked_out);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Visitor Management</div>
          <div className="page-subheading">{active.length} active visitor{active.length !== 1 ? 's' : ''} on campus</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={14} /> Log Visitor
        </button>
      </div>

      <div className="card mb-16">
        <div className="card-header"><div className="card-title">Active Visitors</div></div>
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>ID Number</th><th>Reason</th><th>Host</th><th>Time In</th><th>Expected Exit</th><th>Action</th></tr>
              </thead>
              <tbody>
                {active.map(v => (
                  <tr key={v.id}>
                    <td className="font-bold">{v.name}</td>
                    <td className="text-muted">{v.id_number || '—'}</td>
                    <td>{v.reason}</td>
                    <td>{v.host}</td>
                    <td className="text-muted">{v.time_in}</td>
                    <td className="text-muted">{v.expected_exit || '—'}</td>
                    <td>
                      <button className="btn btn-green btn-sm" onClick={() => handleCheckout(v.id)}>
                        <CheckCircle size={12} /> Check Out
                      </button>
                    </td>
                  </tr>
                ))}
                {active.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 24 }}>No active visitors.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Departed Today</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Reason</th><th>Host</th><th>Time In</th><th>Status</th></tr></thead>
            <tbody>
              {departed.map(v => (
                <tr key={v.id}>
                  <td className="font-bold">{v.name}</td>
                  <td>{v.reason}</td>
                  <td>{v.host}</td>
                  <td className="text-muted">{v.time_in}</td>
                  <td><span className="badge badge-navy">Checked Out</span></td>
                </tr>
              ))}
              {departed.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 24 }}>None yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Log New Visitor</div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">National ID / Passport No.</label>
              <input className="form-input" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} placeholder="CM900123456A" />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Visit *</label>
              <select className="form-select" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                <option value="">Select reason…</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Host (Person / Office) *</label>
              <input className="form-input" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder="Name or department" />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Departure Time</label>
              <input className="form-input" type="time" value={form.expected_exit} onChange={e => setForm(f => ({ ...f, expected_exit: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving…' : 'Log Visitor & Issue Pass'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
