import { useState } from 'react';
import { FileBarChart, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateReport } from '../services/api';

const MONTHLY = [
  { month: 'Nov', entries: 18400 }, { month: 'Dec', entries: 12100 },
  { month: 'Jan', entries: 21300 }, { month: 'Feb', entries: 22800 },
  { month: 'Mar', entries: 23400 }, { month: 'Apr', entries: 19200 },
];

export default function Reports() {
  const [type, setType]   = useState('daily');
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [fmt, setFmt]     = useState('pdf');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await generateReport({ type, from, to, format: fmt });
      const url  = URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `CampusGuard_${type}_report.${fmt}`;
      link.click();
    } catch {
      alert('Connect the backend to generate real reports. Demo mode active.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-heading">Reports</div>
          <div className="page-subheading">Generate and export campus activity reports</div>
        </div>
      </div>

      <div className="grid-2 mb-16">
        {/* Generator */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FileText size={14} style={{ display: 'inline', marginRight: 6 }} />Generate Report</div>
          </div>

          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="daily">Daily Summary</option>
              <option value="monthly">Monthly Summary</option>
              <option value="semestrial">Semestrial Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {(type === 'custom' || type === 'daily') && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">From</label>
                <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">To</label>
                <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Export Format</label>
            <div className="flex-row">
              {['pdf', 'excel'].map(f => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`btn btn-sm ${fmt === f ? 'btn-primary' : 'btn-ghost'}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate} disabled={loading}>
            <Download size={14} />
            {loading ? 'Generating…' : 'Generate & Download Report'}
          </button>
        </div>

        {/* Quick stats */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">This Month</div>
          </div>
          {[
            { label: 'Total Entries',     value: '19,204' },
            { label: 'Total Exits',       value: '18,890' },
            { label: 'Unique Users',      value: '2,341' },
            { label: 'Visitor Entries',   value: '412' },
            { label: 'Security Alerts',   value: '37' },
            { label: 'Denied Attempts',   value: '29' },
          ].map(s => (
            <div key={s.label} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--grey-100)' }}>
              <span style={{ fontSize: 13, color: 'var(--grey-700)' }}>{s.label}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><FileBarChart size={14} style={{ display: 'inline', marginRight: 6 }} />Monthly Entry Volume</div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A8F9E' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8A8F9E' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #EEF0F4' }} />
            <Bar dataKey="entries" fill="#1A2F45" radius={[4, 4, 0, 0]} name="Entries" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
