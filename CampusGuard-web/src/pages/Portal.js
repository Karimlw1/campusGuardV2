import { useState, useEffect, useRef } from 'react';
import { Download, Clock, DoorOpen, Camera, Trash2, Upload, X } from 'lucide-react';
import { Avatar } from '../utils/photo';
import { useAuth } from '../context/AuthContext';
import { getEntries, getUserQR } from '../services/api';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

export default function Portal() {
  const { user }              = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats]     = useState({ days_this_month: 0, total_entries: 0, last_entry: '—', last_exit: '—' });
  const [qrUrl, setQrUrl]     = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoModal, setPhotoModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [drag, setDrag]           = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getEntries({ user_id: user.id, limit: 100 });
      setHistory(data);
      const now = new Date();
      const entries = data.filter(e => e.direction === 'in');
      const exits   = data.filter(e => e.direction === 'out');
      const days = new Set(
        entries.filter(e => {
          const d = new Date(e.scanned_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).map(e => new Date(e.scanned_at).toDateString())
      ).size;
      setStats({ days_this_month: days, total_entries: entries.length, last_entry: entries[0]?.time || '—', last_exit: exits[0]?.time || '—' });
    } catch {}

    // Load QR
    try {
      const { data: blob } = await getUserQR(user.id);
      setQrUrl(URL.createObjectURL(blob));
    } catch {}

    // Load photo
    try {
      const res = await fetch(`${BASE}/users/${user.id}/photo`, { headers: authHeader() });
      if (res.ok) {
        const blob = await res.blob();
        setPhotoUrl(URL.createObjectURL(blob));
      }
    } catch {}

    setLoading(false);
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a'); a.href = qrUrl; a.download = `${user.full_name}_QR.png`; a.click();
  };

  // ── Photo handlers ─────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file (JPG, PNG, etc.)'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', selectedFile);
      const res = await fetch(`${BASE}/users/${user.id}/photo`, { method: 'POST', headers: authHeader(), body: fd });
      if (!res.ok) { const d = await res.json(); alert(d.detail || 'Upload failed'); setUploading(false); return; }
      // Refresh photo
      const photoRes = await fetch(`${BASE}/users/${user.id}/photo`, { headers: authHeader() });
      if (photoRes.ok) { const blob = await photoRes.blob(); setPhotoUrl(URL.createObjectURL(blob)); }
      setPhotoModal(false); setSelectedFile(null); setPreviewUrl(null);
      alert('Profile photo updated successfully!');
    } catch { alert('Network error — check backend connection.'); }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove your profile photo? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE}/users/${user.id}/photo`, { method: 'DELETE', headers: authHeader() });
      if (res.ok) { setPhotoUrl(null); alert('Photo removed.'); }
      else { const d = await res.json(); alert(d.detail || 'Failed to delete'); }
    } catch { alert('Network error'); }
    setDeleting(false);
  };

  const cancelPhoto = () => { setPhotoModal(false); setSelectedFile(null); setPreviewUrl(null); };

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'CG';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">My Portal</div>
          <div className="page-subheading">Your personal campus access record</div>
        </div>
      </div>

      <div className="grid-2 mb-16">
        {/* Profile card */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {/* Photo with edit overlay */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:88, height:88, borderRadius:'50%', overflow:'hidden', background:'var(--ink)', border:'3px solid var(--rule)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {photoUrl
                  ? <img src={photoUrl} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <span style={{ fontSize:28, fontWeight:700, color:'var(--gold)', fontFamily:'DM Sans,sans-serif' }}>{initials}</span>
                }
              </div>
              {/* Camera button overlay */}
              <button
                onClick={() => setPhotoModal(true)}
                title="Change photo"
                style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:'50%', background:'var(--gold)', border:'2px solid var(--white)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Camera size={13} color="var(--ink)" strokeWidth={2.5}/>
              </button>
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', marginBottom:3 }}>{user?.full_name}</div>
              <div style={{ fontSize:14, color:'var(--muted)', marginBottom:2 }}>{user?.reg_number}</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:10 }}>{user?.email}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span className="badge badge-navy">{user?.role}</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setPhotoModal(true)}>
                <Camera size={13}/> Change Photo
              </button>
              {photoUrl && (
                <button className="btn btn-ghost btn-sm" onClick={handleDelete} disabled={deleting} style={{ color:'var(--danger)', borderColor:'var(--danger)' }}>
                  <Trash2 size={13}/> {deleting ? 'Removing…' : 'Remove Photo'}
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleDownloadQR} disabled={!qrUrl}>
                <Download size={13}/> My QR
              </button>
            </div>
          </div>
        </div>

        {/* QR code */}
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
          <div className="card-title">Your QR Code</div>
          {qrUrl ? (
            <>
              <div style={{ background:'white', padding:12, borderRadius:10, border:'2px solid var(--ink)', boxShadow:'var(--shadow-md)' }}>
                <img src={qrUrl} alt="QR Code" style={{ width:160, height:160, display:'block' }}/>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'monospace', wordBreak:'break-all', textAlign:'center', maxWidth:200 }}>
                Show this at the gate scanner
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleDownloadQR}>
                <Download size={12}/> Save QR Image
              </button>
            </>
          ) : (
            <div className="text-center text-muted" style={{ padding:20 }}>
              {loading ? <div className="spinner"/> : 'QR code not available — contact admin'}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Stats */}
        <div className="card">
          <div className="card-title" style={{ marginBottom:18 }}>Access Summary</div>
          {[
            { label:'Days on campus this month', value: stats.days_this_month },
            { label:'Total entries this semester', value: stats.total_entries },
            { label:'Last entry', value: stats.last_entry },
            { label:'Last exit',  value: stats.last_exit },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--rule)' }}>
              <span style={{ fontSize:15, color:'var(--muted-dark)' }}>{s.label}</span>
              <span style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Clock size={14} style={{ display:'inline', marginRight:6 }}/>Entry / Exit History</div>
          </div>
          {loading ? <div className="spinner"/> : history.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">No campus entries recorded yet.</div></div>
          ) : (
            <div style={{ maxHeight:280, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr>
                    {['Direction','Gate','Date & Time'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'9px 10px', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1.5px solid var(--rule)', background:'var(--surface)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} style={{ borderBottom:'1px solid var(--rule)' }}>
                      <td style={{ padding:'11px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <DoorOpen size={14} color={h.direction==='in'?'var(--success)':'var(--muted)'} />
                          <span className={`badge ${h.direction==='in'?'badge-success':'badge-navy'}`}>
                            {h.direction==='in'?'↓ Entry':'↑ Exit'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding:'11px 10px', color:'var(--muted-dark)', fontSize:13 }}>{h.gate}</td>
                      <td style={{ padding:'11px 10px', color:'var(--muted)', fontSize:13 }}>{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      {photoModal && (
        <div className="modal-overlay" onClick={cancelPhoto}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div className="modal-title" style={{ margin:0 }}>
                <Camera size={18} style={{ display:'inline', marginRight:8, verticalAlign:'middle' }}/>
                Update Profile Photo
              </div>
              <button onClick={cancelPhoto} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:4 }}>
                <X size={20}/>
              </button>
            </div>

            {/* Current photo */}
            {photoUrl && !previewUrl && (
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Current Photo</div>
                <img src={photoUrl} alt="Current" style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--rule)', margin:'0 auto', display:'block' }}/>
              </div>
            )}

            {/* Preview of new photo */}
            {previewUrl && (
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>New Photo Preview</div>
                <img src={previewUrl} alt="Preview" style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)', margin:'0 auto', display:'block', boxShadow:'var(--shadow-md)' }}/>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:8 }}>{selectedFile?.name}</div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? 'var(--gold)' : 'var(--rule-dark)'}`,
                background: drag ? 'var(--gold-pale)' : 'var(--surface)',
                borderRadius:'var(--r-md)', padding:'28px 20px',
                textAlign:'center', cursor:'pointer', transition:'all 0.15s',
                marginBottom:16
              }}>
              <Upload size={28} color={drag ? 'var(--gold)' : 'var(--muted)'} style={{ margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)', marginBottom:6 }}>
                {drag ? 'Drop your photo here' : 'Click or drag to upload'}
              </div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>JPG, PNG, WEBP · Max 5MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display:'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cancelPhoto}><X size={13}/> Cancel</button>
              {photoUrl && !previewUrl && (
                <button className="btn btn-ghost" onClick={handleDelete} disabled={deleting}
                  style={{ color:'var(--danger)', borderColor:'var(--danger)' }}>
                  <Trash2 size={13}/> {deleting ? 'Removing…' : 'Remove Photo'}
                </button>
              )}
              <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
                <Upload size={13}/> {uploading ? 'Uploading…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
