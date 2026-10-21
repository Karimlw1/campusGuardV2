import { useState, useEffect } from 'react';
import { RefreshCw, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

export default function GuardStats() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/stats/guards`, { headers: authHeader() }); setGuards(await r.json()); }
    catch {}
    setLoading(false);
  };

  const max = Math.max(...guards.map(g => g.approved_today), 1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Guard Performance</div>
          <div className="page-subheading">Gate activity per security guard — today</div>
        </div>
        <button className="btn btn-ghost" onClick={fetchStats}><RefreshCw size={14}/> Refresh</button>
      </div>

      {loading ? <div className="spinner" /> : guards.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <Shield size={36} color="var(--muted)" style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }} />
          <div style={{ color:'var(--muted)', fontSize:14 }}>No guard accounts found.</div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="stats-grid" style={{ marginBottom:28 }}>
            <div className="stat-card green">
              <div className="stat-label">Total Active Guards</div>
              <div className="stat-value">{guards.filter(g => g.status === 'active').length}</div>
              <div className="stat-sub">On roster</div>
              <div className="stat-icon green"><Shield size={18}/></div>
            </div>
            <div className="stat-card navy">
              <div className="stat-label">Total Admissions Today</div>
              <div className="stat-value">{guards.reduce((s,g) => s + g.approved_today, 0)}</div>
              <div className="stat-sub">Across all guards</div>
              <div className="stat-icon navy"><CheckCircle size={18}/></div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Alerts Today</div>
              <div className="stat-value">{guards.reduce((s,g) => s + g.alerts_today, 0)}</div>
              <div className="stat-sub">Security incidents</div>
              <div className="stat-icon danger"><AlertTriangle size={18}/></div>
            </div>
          </div>

          {/* Guard cards */}
          <div className="grid-2">
            {guards.map(g => (
              <div key={g.id} className="card">
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--ink)', color:'var(--gold)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>
                    {g.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15, color:'var(--ink)' }}>{g.name}</div>
                    <span className={`badge ${g.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{g.status}</span>
                  </div>
                </div>

                {/* Activity bar */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    <span>Admissions today</span>
                    <span style={{ fontFamily:'Fraunces,serif', fontSize:16, color:'var(--ink)', fontWeight:600 }}>{g.approved_today}</span>
                  </div>
                  <div style={{ height:8, background:'var(--rule)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(g.approved_today/max)*100}%`, background:'var(--green-mid)', borderRadius:99, transition:'width 0.6s ease', minWidth: g.approved_today > 0 ? 8 : 0 }} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { label:'All-time admissions', value: g.approved_total },
                    { label:'Alerts today', value: g.alerts_today },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--canvas)', borderRadius:8, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:600, color:'var(--ink)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
