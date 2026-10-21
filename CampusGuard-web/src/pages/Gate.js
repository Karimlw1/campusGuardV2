import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { ScanLine, Search, CheckCircle, XCircle, UserX, Camera, CameraOff, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { Avatar } from '../utils/photo';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('cg_token')}`,
});

export default function Gate() {
  const [mode, setMode]         = useState('guarded');
  const [qrInput, setQrInput]   = useState('');
  const [searchQ, setSearchQ]   = useState('');
  const [result, setResult]     = useState(null);
  const [gate, setGate]         = useState('1');
  const [loading, setLoading]   = useState(false);
  const [admitted, setAdmitted] = useState(null);
  const [log, setLog]           = useState([]);
  const [todayLog, setTodayLog] = useState([]);
  const [camera, setCamera]     = useState(false);
  const [camError, setCamError] = useState('');
  const [scanning, setScanning] = useState(false);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const hasScanned = useRef(false);

  // Load today's log on mount
  useEffect(() => {
    fetch(`${BASE}/entries?limit=40`, { headers: authHeader() })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setTodayLog(d); }).catch(() => {});
  }, []);

  // ── Camera ───────────────────────────────────────────
  useEffect(() => {
    if (camera) startCamera(); else stopCamera();
    return () => stopCamera();
  }, [camera]);

  const startCamera = async () => {
    setCamError(''); hasScanned.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setScanning(true);
        };
      }
    } catch {
      setCamError('Camera access denied. Allow camera in browser settings, or use manual paste below.');
      setCamera(false);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setScanning(false);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  // ── jsQR scan loop ────────────────────────────────────
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || hasScanned.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        hasScanned.current = true;
        setScanning(false);
        setCamera(false);
        processQR(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, []);

  useEffect(() => {
    if (scanning) rafRef.current = requestAnimationFrame(scanFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scanning, scanFrame]);

  // ── QR Processing ─────────────────────────────────────
  const processQR = async (qrValue) => {
    setLoading(true); setResult(null); setAdmitted(null);
    try {
      const res  = await fetch(`${BASE}/gates/scan`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ qr_code: qrValue, gate_id: parseInt(gate), mode }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, user: null, alert: 'Network error — check backend.' });
    }
    setLoading(false);
  };

  const handleManualScan = async () => {
    if (!qrInput.trim()) return;
    await processQR(qrInput.trim());
    setQrInput('');
  };

  // ── Search ────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setLoading(true); setResult(null); setAdmitted(null);
    try {
      const res  = await fetch(`${BASE}/users/search?q=${encodeURIComponent(searchQ)}`, { headers: authHeader() });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Get last direction for first result
        const user = data[0];
        const eRes = await fetch(`${BASE}/entries?user_id=${user.id}&limit=1`, { headers: authHeader() });
        const entries = await eRes.json();
        const lastDir = Array.isArray(entries) && entries[0]?.direction || null;
        setResult({
          valid: true, user,
          all_results: data,
          from_search: true,
          last_direction: lastDir,
          suggested_direction: lastDir === 'in' ? 'out' : 'in',
          direction_issue: null,
          scan_count_today: 0,
        });
      } else {
        setResult({ valid: false, user: null, alert: 'No user found with that name or reg number.' });
      }
    } catch {
      setResult({ valid: false, user: null, alert: 'Search failed — check backend.' });
    }
    setLoading(false);
  };

  // ── Admit / Deny ──────────────────────────────────────
  const handleAdmit = async (direction) => {
    if (!result?.user) return;
    try {
      await fetch(`${BASE}/gates/admit`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ user_id: result.user.id, gate_id: parseInt(gate), direction, mode }),
      });
    } catch {}
    const entry = {
      id: Date.now(),
      user_name: result.user.full_name,
      role: result.user.role,
      direction,
      gate: `Gate ${gate}`,
      time: new Date().toLocaleTimeString(),
      valid: true,
    };
    setLog(l => [entry, ...l].slice(0, 50));
    setTodayLog(l => [entry, ...l].slice(0, 50));
    setAdmitted(direction);
    setTimeout(() => { setResult(null); setAdmitted(null); }, 1800);
  };

  const handleDeny = () => {
    if (result?.user) {
      setLog(l => [{ id: Date.now(), user_name: result.user.full_name, direction: 'denied', time: new Date().toLocaleTimeString(), valid: false }, ...l].slice(0, 50));
    }
    setAdmitted('denied');
    setTimeout(() => { setResult(null); setAdmitted(null); }, 1500);
  };

  const initials = (u) => u?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  const dirLabel = (d) => d === 'in' ? '↓ Entry' : d === 'out' ? '↑ Exit' : 'Denied';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Gate Control</div>
          <div className="page-subheading">Scan QR codes and manage campus entry / exit</div>
        </div>
        <div className="flex-row" style={{ gap: 10 }}>
          <select className="form-select" style={{ width: 160 }} value={gate} onChange={e => setGate(e.target.value)}>
            <option value="1">Main Gate</option>
            <option value="2">North Gate</option>
            <option value="3">South Gate</option>
          </select>
          <div className="flex-row" style={{ background:'var(--white)', border:'1px solid var(--grey-300)', borderRadius:8, padding:4, gap:4 }}>
            {['guarded','auto'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`} style={{ border:'none' }}>
                {m === 'guarded' ? '👮 Guarded' : '⚡ Auto'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* ── Left column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Camera panel */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Camera size={14} style={{ display:'inline', marginRight:6 }}/>Camera Scanner</div>
              <button className={`btn btn-sm ${camera ? 'btn-danger' : 'btn-green'}`}
                onClick={() => { hasScanned.current = false; setCamera(c => !c); }}>
                {camera ? <><CameraOff size={13} style={{ marginRight:4 }}/>Stop</> : <><Camera size={13} style={{ marginRight:4 }}/>Start Camera</>}
              </button>
            </div>

            <canvas ref={canvasRef} style={{ display:'none' }} />

            {camera ? (
              <div style={{ position:'relative', borderRadius:8, overflow:'hidden', background:'#000' }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <div style={{ position:'relative', width:180, height:180 }}>
                    <div style={{ position:'absolute', inset:0, boxShadow:'0 0 0 9999px rgba(0,0,0,0.45)', borderRadius:12 }} />
                    {[
                      { top:0, left:0,  borderTop:'3px solid var(--gold)', borderLeft:'3px solid var(--gold)',   borderRadius:'8px 0 0 0' },
                      { top:0, right:0, borderTop:'3px solid var(--gold)', borderRight:'3px solid var(--gold)',  borderRadius:'0 8px 0 0' },
                      { bottom:0, left:0,  borderBottom:'3px solid var(--gold)', borderLeft:'3px solid var(--gold)',  borderRadius:'0 0 0 8px' },
                      { bottom:0, right:0, borderBottom:'3px solid var(--gold)', borderRight:'3px solid var(--gold)', borderRadius:'0 0 8px 0' },
                    ].map((s,i) => <div key={i} style={{ position:'absolute', width:28, height:28, ...s }} />)}
                  </div>
                </div>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.6)', color:'var(--gold)', textAlign:'center', padding:8, fontSize:12, fontWeight:600 }}>
                  {scanning ? '🔍 Scanning — point QR at the box' : 'Starting scanner…'}
                </div>
              </div>
            ) : (
              <div style={{ background:'var(--offwhite)', borderRadius:8, height:110, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--grey-500)', fontSize:13 }}>
                <Camera size={28} color="var(--grey-300)" />
                Click "Start Camera" to scan QR codes
              </div>
            )}
            {camError && (
              <div style={{ display:'flex', gap:8, marginTop:10, background:'var(--warn-bg)', borderRadius:6, padding:'8px 10px', fontSize:12, color:'var(--warn)' }}>
                <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }} />{camError}
              </div>
            )}
          </div>

          {/* Manual + Search */}
          <div className="card">
            <div className="card-title" style={{ marginBottom:14 }}>
              <ScanLine size={14} style={{ display:'inline', marginRight:6 }}/>Manual Entry
            </div>
            <div className="form-group">
              <label className="form-label">Paste QR Code Value</label>
              <div className="flex-row" style={{ gap:8 }}>
                <input className="form-input" placeholder="Paste QR code string here…"
                  value={qrInput} onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualScan()} />
                <button className="btn btn-primary" onClick={handleManualScan} disabled={loading || !qrInput.trim()}>Scan</button>
              </div>
            </div>
            <div style={{ textAlign:'center', color:'var(--grey-300)', margin:'8px 0', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em' }}>— or search by name / reg number —</div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Student / Staff Lookup</label>
              <div className="flex-row" style={{ gap:8 }}>
                <input className="form-input" placeholder="e.g. Joan Akello or 23/BIT/BU…"
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !searchQ.trim()}>
                  <Search size={14} />
                </button>
              </div>
              <div style={{ fontSize:11, color:'var(--grey-500)', marginTop:5 }}>Use when student forgot their ID card.</div>
            </div>
          </div>

          {/* Multiple results picker */}
          {result?.from_search && result?.all_results?.length > 1 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom:12 }}>Multiple results — select one</div>
              {result.all_results.map((u, i) => (
                <div key={u.id} onClick={() => setResult({ valid:true, user:u, suggested_direction: result.suggested_direction, last_direction: result.last_direction, direction_issue: null, scan_count_today:0 })}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < result.all_results.length-1 ? '1px solid var(--grey-100)' : 'none', cursor:'pointer' }}>
                  <div className="topbar-avatar" style={{ width:32, height:32, fontSize:11 }}>{initials(u)}</div>
                  <div>
                    <div style={{ fontWeight:600 }}>{u.full_name}</div>
                    <div style={{ fontSize:11, color:'var(--grey-500)' }}>{u.reg_number} · {u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && <div className="text-center text-muted" style={{ padding:16, fontSize:13 }}>Checking…</div>}

          {/* Scan result */}
          {result && !admitted && !(result?.from_search && result?.all_results?.length > 1) && (
            result?.valid && result?.user ? (
              <div>
                {/* Direction warnings */}
                {result.direction_issue === 'already_in' && (
                  <div style={{ background:'var(--warn-bg)', border:'1px solid var(--warn)', borderRadius:8, padding:'10px 14px', marginBottom:10, display:'flex', gap:10, alignItems:'flex-start' }}>
                    <AlertTriangle size={16} color="var(--warn)" style={{ flexShrink:0, marginTop:2 }} />
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--warn)' }}>⚠ Already inside campus</div>
                      <div style={{ fontSize:12, color:'var(--grey-700)', marginTop:2 }}>Last scan was an entry. Verify before allowing re-entry.</div>
                    </div>
                  </div>
                )}
                {result.scan_count_today >= 6 && (
                  <div style={{ background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:8, padding:'8px 14px', marginBottom:10, fontSize:12, color:'var(--danger)' }}>
                    ⚠ Scanned {result.scan_count_today}× today — flagged as suspicious
                  </div>
                )}

                <div className="scan-result valid">
                  <Avatar
                    userId={result.user.id}
                    name={result.user.full_name}
                    size="full"
                    px={64}
                    fontSize={22}
                    style={{ flexShrink:0, border:'3px solid var(--gold)' }}
                  />
                  <div style={{ flex:1 }}>
                    <div className="scan-name">{result.user.full_name}</div>
                    <div className="scan-meta">{result.user.role} · {result.user.reg_number}</div>
                    <div style={{ marginTop:6, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      <span className={`badge ${result.user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{result.user.status}</span>
                      {result.last_direction && (
                        <span style={{ fontSize:11, color:'var(--grey-500)' }}>
                          Last: {result.last_direction === 'in' ? '↓ entered' : '↑ exited'} today
                        </span>
                      )}
                      {!result.last_direction && (
                        <span style={{ fontSize:11, color:'var(--grey-500)' }}>First scan today</span>
                      )}
                    </div>
                  </div>

                  {mode === 'guarded' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <button
                        className={`btn btn-sm ${result.suggested_direction === 'in' ? 'btn-green' : 'btn-ghost'}`}
                        style={{ fontWeight: result.suggested_direction === 'in' ? 700 : 400, opacity: result.suggested_direction === 'out' ? 0.6 : 1 }}
                        onClick={() => handleAdmit('in')}>
                        <ArrowDown size={12}/> Let In
                      </button>
                      <button
                        className={`btn btn-sm ${result.suggested_direction === 'out' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontWeight: result.suggested_direction === 'out' ? 700 : 400, opacity: result.suggested_direction === 'in' ? 0.6 : 1 }}
                        onClick={() => handleAdmit('out')}>
                        <ArrowUp size={12}/> Let Out
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={handleDeny}>✕ Deny</button>
                    </div>
                  )}
                  {mode === 'auto' && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <CheckCircle size={32} color="var(--success)" />
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--success)' }}>
                        {result.suggested_direction === 'in' ? 'Entry logged' : 'Exit logged'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="scan-result invalid">
                <UserX size={36} color="var(--danger)" />
                <div>
                  <div className="scan-name" style={{ color:'var(--danger)' }}>Access Denied</div>
                  <div className="scan-meta">{result?.alert || 'QR code not recognised.'}</div>
                </div>
                <XCircle size={24} color="var(--danger)" />
              </div>
            )
          )}

          {/* Flash feedback */}
          {admitted && (
            <div className={`scan-result ${admitted === 'denied' ? 'invalid' : 'valid'}`}>
              {admitted === 'in'     && <><CheckCircle size={26} color="var(--success)"/><div><div style={{ fontWeight:700, color:'var(--success)', fontSize:15 }}>Entry Logged ✓</div><div style={{ fontSize:12, color:'var(--grey-500)' }}>Campus entry recorded</div></div></>}
              {admitted === 'out'    && <><CheckCircle size={26} color="var(--success)"/><div><div style={{ fontWeight:700, color:'var(--success)', fontSize:15 }}>Exit Logged ✓</div><div style={{ fontSize:12, color:'var(--grey-500)' }}>Campus exit recorded</div></div></>}
              {admitted === 'denied' && <><XCircle size={26} color="var(--danger)"/><span style={{ color:'var(--danger)', fontWeight:700, fontSize:15 }}>Access Denied</span></>}
            </div>
          )}
        </div>

        {/* ── Right column — log ── */}
        <div className="card" style={{ alignSelf:'flex-start' }}>
          <div className="card-header">
            <div className="card-title">Today's Gate Log</div>
            <span style={{ fontSize:12, color:'var(--grey-500)' }}>{todayLog.length} records</span>
          </div>
          {todayLog.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--grey-500)', fontSize:13 }}>No activity yet. Start scanning.</div>
          ) : (
            <div style={{ maxHeight:500, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>{['Name','Role','Direction','Time'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, color:'var(--grey-500)', textTransform:'uppercase', borderBottom:'2px solid var(--grey-100)', background:'var(--offwhite)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {todayLog.map((r,i) => (
                    <tr key={r.id || i} style={{ borderBottom:'1px solid var(--grey-100)' }}>
                      <td style={{ padding:'9px 10px', fontWeight:600 }}>{r.user_name || r.name || '—'}</td>
                      <td style={{ padding:'9px 10px', color:'var(--grey-500)', fontSize:12 }}>{r.role || '—'}</td>
                      <td style={{ padding:'9px 10px' }}>
                        <span className={`badge ${r.direction === 'in' ? 'badge-success' : r.direction === 'out' ? 'badge-navy' : 'badge-danger'}`}>
                          {dirLabel(r.direction)}
                        </span>
                      </td>
                      <td style={{ padding:'9px 10px', color:'var(--grey-500)', fontSize:11 }}>{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
