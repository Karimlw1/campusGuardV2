import { useState, useEffect } from 'react';
import { Plus, Search, Download, Trash2, Edit2, X, Save, Camera, RefreshCw, AlertTriangle } from 'lucide-react';
import { Avatar } from '../utils/photo';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cg_token')}` });
const authHeaderPlain = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

const ROLES    = ['student','staff','lecturer','guard','admin'];
const STATUSES = ['active','inactive','blacklisted'];
const EMPTY    = { full_name:'', email:'', role:'student', reg_number:'', password:'' };

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [createModal, setCreate]= useState(false);
  const [editModal, setEdit]    = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/users`, { headers: authHeader() }); const d = await r.json(); if (Array.isArray(d)) setUsers(d); }
    catch {} setLoading(false);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.full_name?.toLowerCase().includes(q) || u.reg_number?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (filter === 'all' || u.role === filter);
  });

  const handleCreate = async () => {
    if (!form.full_name || !form.reg_number || !form.password || !form.email) { alert('Fill all required fields.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/users`, { method:'POST', headers: authHeader(), body: JSON.stringify(form) });
      const d   = await res.json();
      if (!res.ok) { alert(d.detail || 'Error'); setSaving(false); return; }
      setUsers(u => [...u, d]); setCreate(false); setForm(EMPTY);
    } catch { alert('Network error'); }
    setSaving(false);
  };

  const openEdit = (u) => { setEditUser(u); setEditForm({ full_name: u.full_name, email: u.email, status: u.status }); setPhotoFile(null); setEdit(true); };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/users/${editUser.id}`, { method:'PUT', headers: authHeader(), body: JSON.stringify(editForm) });
      const d   = await res.json();
      if (!res.ok) { alert(d.detail || 'Error'); setSaving(false); return; }
      setUsers(u => u.map(x => x.id === editUser.id ? { ...x, ...d } : x));

      // Upload photo if selected
      if (photoFile) {
        setPhotoUploading(true);
        const fd = new FormData(); fd.append('file', photoFile);
        await fetch(`${BASE}/users/${editUser.id}/photo`, { method:'POST', headers: authHeaderPlain(), body: fd });
        setPhotoUploading(false);
      }
      setEdit(false);
    } catch { alert('Network error'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      const res = await fetch(`${BASE}/users/${id}`, { method:'DELETE', headers: authHeader() });
      if (!res.ok) { const d = await res.json(); alert(d.detail || 'Cannot delete.'); return; }
      setUsers(u => u.filter(x => x.id !== id));
    } catch { alert('Network error'); }
  };

  const handleQR = async (id, name) => {
    try {
      const res = await fetch(`${BASE}/users/${id}/qr`, { headers: authHeaderPlain() });
      if (!res.ok) { alert('QR not found'); return; }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a'); a.href = url; a.download = `${name}_QR.png`; a.click();
    } catch { alert('QR download failed.'); }
  };

  const handleRenewQR = async (id, name) => {
    if (!window.confirm(`Renew QR for ${name}? Old QR will stop working.`)) return;
    try {
      const res = await fetch(`${BASE}/users/${id}/renew-qr`, { method:'POST', headers: authHeader() });
      if (res.ok) { alert('QR renewed successfully. Download the new QR.'); fetchUsers(); }
      else { const d = await res.json(); alert(d.detail); }
    } catch { alert('Network error'); }
  };

  const handleReportLost = async (id, name) => {
    if (!window.confirm(`Report ${name}'s QR as lost/stolen? A new QR will be generated.`)) return;
    try {
      const res = await fetch(`${BASE}/users/${id}/report-qr-lost`, { method:'POST', headers: authHeader() });
      if (res.ok) { alert('QR invalidated. New QR generated and alert raised.'); fetchUsers(); }
      else { const d = await res.json(); alert(d.detail); }
    } catch { alert('Network error'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">User Management</div>
          <div className="page-subheading">{users.length} registered users</div>
        </div>
        <div className="flex-row">
          <button className="btn btn-ghost" onClick={fetchUsers}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-primary" onClick={() => setCreate(true)}><Plus size={14}/> Add User</button>
        </div>
      </div>

      <div className="flex-row mb-16">
        <div className="search-bar">
          <Search size={14} color="var(--muted)" />
          <input placeholder="Search name, reg no, email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width:140 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="spinner"/> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Reg / ID</th><th>Role</th><th>Email</th><th>Status</th><th>QR Expires</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex-row">
                        <Avatar userId={u.id} name={u.full_name} size="thumb" px={36} fontSize={12} />
                        <span className="font-bold">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{u.reg_number}</td>
                    <td><span className="badge badge-navy">{u.role}</span></td>
                    <td className="text-muted" style={{ fontSize:12 }}>{u.email}</td>
                    <td><span className={`badge ${u.status==='active'?'badge-success':u.status==='blacklisted'?'badge-danger':'badge-warn'}`}>{u.status}</span></td>
                    <td>
                      {u.qr_expires ? (
                        <span style={{ fontSize:11, color: new Date(u.qr_expires) < new Date() ? 'var(--danger)' : 'var(--muted)' }}>
                          {new Date(u.qr_expires) < new Date() ? '⚠ ' : ''}{new Date(u.qr_expires).toLocaleDateString()}
                        </span>
                      ) : <span style={{ fontSize:11, color:'var(--muted)' }}>No expiry</span>}
                    </td>
                    <td>
                      <div className="flex-row">
                        <button className="btn btn-ghost btn-sm" title="Download QR" onClick={() => handleQR(u.id, u.full_name)}><Download size={12}/></button>
                        <button className="btn btn-ghost btn-sm" title="Edit / Upload Photo" onClick={() => openEdit(u)}><Edit2 size={12}/></button>
                        <button className="btn btn-ghost btn-sm" title="Renew QR (new semester)" onClick={() => handleRenewQR(u.id, u.full_name)}><RefreshCw size={12}/></button>
                        <button className="btn btn-ghost btn-sm" title="Report QR lost/stolen" onClick={() => handleReportLost(u.id, u.full_name)}><AlertTriangle size={12}/></button>
                        <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDelete(u.id, u.full_name)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-muted" style={{ padding:32 }}>No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add New User</div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} placeholder="John Doe"/></div>
              <div className="form-group"><label className="form-label">Reg / Staff Number *</label><input className="form-input" value={form.reg_number} onChange={e => setForm(f=>({...f,reg_number:e.target.value}))} placeholder="23/BIT/BU/R/0001"/></div>
            </div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="user@bugema.ac.ug"/></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••"/></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setCreate(false)}><X size={13}/> Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?'Creating…':'Create User & Generate QR'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editUser && (
        <div className="modal-overlay" onClick={() => setEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit — {editUser.full_name}</div>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={editForm.full_name} onChange={e => setEditForm(f=>({...f,full_name:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm(f=>({...f,email:e.target.value}))}/></div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={e => setEditForm(f=>({...f,status:e.target.value}))}>
                {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
              </select>
              {editForm.status === 'blacklisted' && <div style={{ marginTop:8, fontSize:12, color:'var(--danger)', background:'var(--danger-pale)', padding:'8px 12px', borderRadius:6 }}>⚠ Blacklisted users will be denied at all gates and an alert will be raised.</div>}
            </div>
            {/* Photo upload */}
            <div className="form-group">
              <label className="form-label"><Camera size={11} style={{ display:'inline', marginRight:4 }}/>Profile Photo</label>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <Avatar userId={editUser.id} name={editUser.full_name} size="small" px={52} fontSize={16} />
                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])}
                  style={{ fontSize:12, color:'var(--muted-dark)' }} />
              </div>
              {photoFile && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Will upload: {photoFile.name}</div>}
              {photoUploading && <div style={{ fontSize:11, color:'var(--green)', marginTop:4 }}>Uploading photo…</div>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEdit(false)}><X size={13}/> Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}><Save size={13}/> {saving?'Saving…':'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
