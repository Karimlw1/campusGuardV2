import { useState, useEffect, useCallback } from 'react';
import { Users, DoorOpen, AlertTriangle, UserCheck, Activity, RefreshCw } from 'lucide-react';
import { Avatar } from '../utils/photo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

export default function Dashboard() {
  const [stats, setStats]       = useState({ total_users: 0, on_campus: 0, visitors_today: 0, alerts_today: 0, lockdown: false });
  const [activity, setActivity] = useState([]);
  const [onCampus, setOnCampus] = useState([]);
  const [weekly, setWeekly]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    // Passive auto-alert check (visitor overstays etc.)
    try {
      await fetch(`${BASE}/alerts/check-auto`, {
        method: 'POST', headers: authHeader()
      });
    } catch {}

    try {
      const [s, a, c, w] = await Promise.all([
        fetch(`${BASE}/dashboard/stats`, { headers: authHeader() }).then(r => r.json()),
        fetch(`${BASE}/entries?limit=15`,  { headers: authHeader() }).then(r => r.json()),
        fetch(`${BASE}/campus/live`,        { headers: authHeader() }).then(r => r.json()),
        fetch(`${BASE}/reports/weekly`,     { headers: authHeader() }).then(r => r.ok ? r.json() : []),
      ]);
      if (s) setStats(s);
      if (Array.isArray(a)) setActivity(a);
      if (Array.isArray(c)) setOnCampus(c);
      if (Array.isArray(w)) setWeekly(w);
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const STAT_CARDS = [
    { label: 'Registered Users', value: stats.total_users, sub: 'All roles',        cls: 'navy',   icon: <Users size={24}/> },
    { label: 'On Campus Now',    value: stats.on_campus,   sub: 'Checked in today', cls: 'green',  icon: <Activity size={24}/> },
    { label: 'Visitors Today',   value: stats.visitors_today, sub: 'Logged & approved', cls: 'gold', icon: <UserCheck size={24}/> },
    { label: 'Active Alerts',    value: stats.alerts_today, sub: 'Unresolved',      cls: 'danger', icon: <AlertTriangle size={24}/> },
  ];

  return (
    <div className="page">
      {/* Lockdown banner */}
      {stats.lockdown && (
        <div style={{ background:'var(--danger)', color:'white', padding:'14px 24px', borderRadius:'var(--r-md)', marginBottom:24, display:'flex', alignItems:'center', gap:14, fontSize:18, fontWeight:700 }}>
          <AlertTriangle size={24}/>
          🔴 CAMPUS LOCKDOWN ACTIVE — All gate access denied
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-heading">Dashboard</div>
          <div className="page-subheading">Live overview — {new Date().toDateString()}</div>
        </div>
        <button className="btn btn-ghost" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={16} />
          {loading ? 'Refreshing…' : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-16">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Weekly Entry Traffic</div>
          </div>
          {weekly.length === 0 ? (
            <div className="empty-state" style={{ padding:'48px 0' }}>
              <div className="empty-state-text" style={{ fontSize:16 }}>No entries this week yet.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E0"/>
                <XAxis dataKey="day" tick={{ fontSize:14, fill:'#8C8880' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:13, fill:'#8C8880' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize:14, borderRadius:8 }}/>
                <Line type="monotone" dataKey="entries" stroke="#0E1A26" strokeWidth={2.5} dot={{ fill:'#C8963E', r:4 }} name="Entries"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Currently On Campus</div>
            <span style={{ fontSize:14, background:'var(--green-pale)', color:'var(--green)', padding:'4px 12px', borderRadius:99, fontWeight:600 }}>
              {onCampus.length} inside
            </span>
          </div>
          {onCampus.length === 0 ? (
            <div className="empty-state" style={{ padding:'40px 0' }}>
              <div className="empty-state-text" style={{ fontSize:15 }}>
                {loading ? <div className="spinner"/> : 'No one checked in yet today.'}
              </div>
            </div>
          ) : (
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              {onCampus.map((u, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 0', borderBottom:'1px solid var(--rule)' }}>
                  <Avatar userId={u.id} name={u.full_name} size="thumb" px={38} fontSize={13} />
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)' }}>{u.full_name}</div>
                    <div style={{ fontSize:13, color:'var(--muted)' }}>{u.role} · entered {u.entry_time}</div>
                  </div>
                  <span className="badge badge-success" style={{ marginLeft:'auto' }}>Inside</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Gate Activity */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <DoorOpen size={16} style={{ display:'inline', marginRight:8, verticalAlign:'middle' }}/>
            Recent Gate Activity
          </div>
        </div>
        {activity.length === 0 ? (
          <div className="empty-state">
            {loading ? <div className="spinner"/> : <div className="empty-state-text" style={{ fontSize:15 }}>No gate activity yet. Start scanning at the gate.</div>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Direction</th><th>Gate</th><th>Time</th></tr>
              </thead>
              <tbody>
                {activity.map((row, i) => (
                  <tr key={row.id || i}>
                    <td style={{ fontWeight:600 }}>{row.user_name || '—'}</td>
                    <td style={{ color:'var(--muted)' }}>{row.role || '—'}</td>
                    <td>
                      <span className={`badge ${row.direction === 'in' ? 'badge-success' : 'badge-navy'}`}>
                        {row.direction === 'in' ? '↓ Entry' : '↑ Exit'}
                      </span>
                    </td>
                    <td style={{ color:'var(--muted)' }}>{row.gate}</td>
                    <td style={{ color:'var(--muted)', fontSize:13 }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
