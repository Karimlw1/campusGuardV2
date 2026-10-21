import { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('cg_token')}` });

export default function BulkImport() {
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag]       = useState(false);

  const downloadTemplate = async () => {
    const res  = await fetch(`${BASE}/users/bulk-template`, { headers: authHeader() });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'campusguard_import_template.xlsx'; a.click();
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    const form = new FormData(); form.append('file', file);
    try {
      const res  = await fetch(`${BASE}/users/bulk-import`, { method: 'POST', headers: authHeader(), body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || 'Import failed'); } else { setResult(data); }
    } catch { alert('Network error'); }
    setLoading(false);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) setFile(f); else alert('Please drop an .xlsx file');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Bulk User Import</div>
          <div className="page-subheading">Import students and staff from an Excel spreadsheet</div>
        </div>
        <button className="btn btn-ghost" onClick={downloadTemplate}>
          <Download size={14} /> Download Template
        </button>
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-16">
            <div className="card-title" style={{ marginBottom: 16 }}>How it works</div>
            {[
              ['1', 'Download the Excel template above'],
              ['2', 'Fill in: full_name, email, reg_number, role, password'],
              ['3', 'Save as .xlsx and upload below'],
              ['4', 'System creates users and generates QR codes automatically'],
              ['5', 'Duplicates (same email or reg number) are skipped'],
            ].map(([n, t]) => (
              <div key={n} style={{ display:'flex', gap:12, padding:'9px 0', borderBottom:'1px solid var(--rule)', alignItems:'center' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--ink)', color:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
                <span style={{ fontSize:13, color:'var(--muted-dark)' }}>{t}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Required columns</div>
            {[
              ['full_name', 'Full name of user', true],
              ['email', 'Unique email address', true],
              ['reg_number', 'Registration / staff number', true],
              ['role', 'student | staff | lecturer | guard', true],
              ['password', 'Initial password (user changes later)', true],
            ].map(([col, desc, req]) => (
              <div key={col} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--rule)', alignItems:'center' }}>
                <div>
                  <span style={{ fontFamily:'monospace', fontSize:12, background:'var(--canvas)', padding:'2px 6px', borderRadius:4, color:'var(--ink)' }}>{col}</span>
                  <span style={{ fontSize:12, color:'var(--muted)', marginLeft:10 }}>{desc}</span>
                </div>
                {req && <span className="badge badge-danger" style={{ fontSize:9 }}>required</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          {/* Drop zone */}
          <div className="card mb-16"
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            style={{ border: `2px dashed ${drag ? 'var(--gold)' : 'var(--rule-dark)'}`, background: drag ? 'var(--gold-pale)' : 'var(--surface)', transition:'all 0.15s', cursor:'pointer', textAlign:'center', padding:40 }}>
            <FileSpreadsheet size={40} color={drag ? 'var(--gold)' : 'var(--muted)'} style={{ margin:'0 auto 16px', display:'block' }} />
            <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)', marginBottom:8 }}>
              {file ? file.name : 'Drop your .xlsx file here'}
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>
              {file ? `${(file.size/1024).toFixed(1)} KB ready to import` : 'or click to browse'}
            </div>
            <input type="file" accept=".xlsx" id="file-input" style={{ display:'none' }}
              onChange={e => setFile(e.target.files[0])} />
            <label htmlFor="file-input" className="btn btn-ghost" style={{ cursor:'pointer' }}>
              <Upload size={14} /> {file ? 'Change file' : 'Browse file'}
            </label>
          </div>

          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12, fontSize:14, marginBottom:16 }}
            onClick={handleImport} disabled={!file || loading}>
            <Upload size={15} /> {loading ? 'Importing…' : 'Import Users & Generate QR Codes'}
          </button>

          {/* Result */}
          {result && (
            <div className="card">
              <div className="card-title" style={{ marginBottom:16 }}>Import Results</div>
              <div className="grid-2" style={{ marginBottom:16 }}>
                <div style={{ textAlign:'center', padding:'16px', background:'var(--green-pale)', borderRadius:8 }}>
                  <CheckCircle size={24} color="var(--green)" style={{ margin:'0 auto 8px', display:'block' }} />
                  <div style={{ fontSize:28, fontWeight:700, fontFamily:'Fraunces,serif', color:'var(--green)' }}>{result.created}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>Created</div>
                </div>
                <div style={{ textAlign:'center', padding:'16px', background:'var(--warn-pale)', borderRadius:8 }}>
                  <XCircle size={24} color="var(--warn)" style={{ margin:'0 auto 8px', display:'block' }} />
                  <div style={{ fontSize:28, fontWeight:700, fontFamily:'Fraunces,serif', color:'var(--warn)' }}>{result.skipped}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>Skipped (duplicates)</div>
                </div>
              </div>
              {result.created_list?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Created</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {result.created_list.map(r => <span key={r} className="badge badge-success">{r}</span>)}
                    {result.created > 20 && <span className="badge badge-navy">+{result.created - 20} more</span>}
                  </div>
                </div>
              )}
              {result.errors?.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--danger)', textTransform:'uppercase', marginBottom:8 }}>Errors</div>
                  {result.errors.map((e,i) => <div key={i} style={{ fontSize:12, color:'var(--danger)' }}>{e.reg}: {e.error}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
