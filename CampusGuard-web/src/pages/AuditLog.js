import { useState, useEffect } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

const ACTION_COLORS = {
  'lockdown.activate': 'danger', 'lockdown.lift': 'success',
  'user.blacklist': 'danger', 'user.qr_regenerate': 'warn',
  'user.qr_renew': 'navy', 'user.photo_upload': 'navy',
  'users.bulk_import': 'gold', 'visitor.pre_register': 'navy',
};

export default function AuditLog() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/audit-logs?limit=200`, { headers: authHeader() }); setLogs(await r.json()); } catch {}
    setLoading(false);
  };

  const filtered = logs.filter(l =>
    !filter || l.actor?.toLowerCase().includes(filter.toLowerCase()) ||
    l.action?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Audit Log</div>
          <div className="page-subheading">Every admin action — who did what and when</div>
        </div>
        <button className="btn btn-ghost" onClick={fetchLogs}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Shield size={13} style={{ display:'inline', marginRight:6 }}/>System Activity</div>
          <input className="form-input" style={{ width: 220 }} placeholder="Filter by user or action…"
            value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-text">No audit records yet.</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
              <tbody>
                {filtered.map(l => {
                  const cls = ACTION_COLORS[l.action] || 'navy';
                  let detail = '';
                  try { const d = JSON.parse(l.detail || '{}'); detail = Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(' · '); } catch {}
                  return (
                    <tr key={l.id}>
                      <td className="text-muted" style={{ fontSize: 12, whiteSpace:'nowrap' }}>{l.timestamp}</td>
                      <td className="font-bold">{l.actor}</td>
                      <td><span className={`badge badge-${cls}`}>{l.action}</span></td>
                      <td className="text-muted">{l.target_type ? `${l.target_type} #${l.target_id}` : '—'}</td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{detail || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
