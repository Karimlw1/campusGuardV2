import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      navigate(['student','staff','lecturer'].includes(user.role) ? '/portal' : '/');
    } catch (err) {
      if (err.response?.status === 401) setError('Wrong credentials. Use your email or reg number.');
      else if (!err.response) setError('Cannot reach server — is the backend running on port 8001?');
      else setError('Login failed — try again.');
    } finally { setLoading(false); }
  };

  const fill = (u, p) => setForm({ username: u, password: p });

  return (
    <div className="login-wrap">
      {/* Left — brand panel */}
      <div className="login-left">
        <div className="login-brand">

          <div class="div-brand-logo">
              <img className='logo' src='https://tse4.mm.bing.net/th/id/OIP.5q-keyoDuYtdFsLNnkkKAAHaHi?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' alt='bugema-logo'></img>
          </div>

          <div className="login-brand-name">CampusGuard</div>
          <div className="login-brand-tagline">
            Smart QR-based access control and real-time security monitoring for Bugema University.
          </div>
          {[
            'QR code gate scanning — camera or manual',
            'Live campus occupancy tracking',
            'Automated security alerts',
            'Visitor management & digital passes',
            'Admin reports — daily, monthly, semestrial',
          ].map(f => (
            <div key={f} className="login-feature">
              <div className="login-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="login-right">
        <div className="login-box">
          <div className="login-box-title">Sign in</div>
          <div className="login-box-sub">Use your email address or registration number</div>

          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Email or Reg Number</label>
              <input className="form-input" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="admin@campusguard.ug" autoComplete="username" required />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" autoComplete="current-password" required />
            </div>

            {error && (
              <div style={{ background: 'var(--danger-pale)', color: 'var(--danger)', borderRadius: 'var(--r-sm)', padding: '9px 13px', fontSize: 12.5, marginBottom: 16, borderLeft: '3px solid var(--danger)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
              disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Quick-fill */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Quick access — development
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Admin',    u: 'admin@campusguard.ug', p: 'admin123'    },
                { label: 'Guard',    u: 'guard@campusguard.ug', p: 'guard123'    },
                { label: 'Student',  u: '23/BIT/BU/R/0017',     p: 'student123'  },
                { label: 'Lecturer', u: 'kotieno@bugema.ac.ug', p: 'lecturer123' },
              ].map(d => (
                <button key={d.label} type="button" onClick={() => fill(d.u, d.p)}
                  style={{ padding: '7px 10px', background: 'var(--canvas)', border: '1px solid var(--rule-dark)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--muted-dark)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseOver={e => e.target.style.background = 'var(--rule)'}
                  onMouseOut={e => e.target.style.background = 'var(--canvas)'}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
