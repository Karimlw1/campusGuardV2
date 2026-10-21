import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Avatar } from './utils/photo';
import Sidebar    from './components/Sidebar';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Gate       from './pages/Gate';
import Users      from './pages/Users';
import Visitors   from './pages/Visitors';
import Alerts     from './pages/Alerts';
import Reports    from './pages/Reports';
import Portal     from './pages/Portal';
import Lockdown   from './pages/Lockdown';
import AuditLog   from './pages/AuditLog';
import BulkImport from './pages/BulkImport';
import GuardStats from './pages/GuardStats';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: 120 }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location]);
  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={sidebarOpen ? 'open' : ''}><Sidebar /></div>

      <div className="main-content">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="topbar-title">CampusGuard — Access Control System</span>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
            </span>
            {/* small size = 160px source at 40px display — sharp, ~4KB download */}
            <Avatar userId={user?.id} name={user?.full_name} size="small" px={40} fontSize={14} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const isStudent = ['student','staff','lecturer'].includes(user?.role);
  const defaultPath = user ? (isStudent ? '/portal' : '/') : '/login';
  return (
    <Routes>
      <Route path="/login"        element={<Login />} />
      <Route path="/"             element={<RequireAuth roles={['admin','guard']}><Shell><Dashboard /></Shell></RequireAuth>} />
      <Route path="/gate"         element={<RequireAuth roles={['admin','guard']}><Shell><Gate /></Shell></RequireAuth>} />
      <Route path="/visitors"     element={<RequireAuth roles={['admin','guard']}><Shell><Visitors /></Shell></RequireAuth>} />
      <Route path="/alerts"       element={<RequireAuth roles={['admin','guard']}><Shell><Alerts /></Shell></RequireAuth>} />
      <Route path="/users"        element={<RequireAuth roles={['admin']}><Shell><Users /></Shell></RequireAuth>} />
      <Route path="/bulk-import"  element={<RequireAuth roles={['admin']}><Shell><BulkImport /></Shell></RequireAuth>} />
      <Route path="/guard-stats"  element={<RequireAuth roles={['admin']}><Shell><GuardStats /></Shell></RequireAuth>} />
      <Route path="/reports"      element={<RequireAuth roles={['admin']}><Shell><Reports /></Shell></RequireAuth>} />
      <Route path="/lockdown"     element={<RequireAuth roles={['admin']}><Shell><Lockdown /></Shell></RequireAuth>} />
      <Route path="/audit-log"    element={<RequireAuth roles={['admin']}><Shell><AuditLog /></Shell></RequireAuth>} />
      <Route path="/portal"       element={<RequireAuth roles={['student','staff','lecturer']}><Shell><Portal /></Shell></RequireAuth>} />
      <Route path="*"             element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>
  );
}
