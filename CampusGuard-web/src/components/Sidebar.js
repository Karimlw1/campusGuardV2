import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Users, UserCheck, Bell,
  FileBarChart, LogOut, ShieldAlert, FileSpreadsheet,
  ClipboardList, BarChart2, DoorOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../utils/photo';

const NAV = {
  admin: [
    { section: 'Operations' },
    { label: 'Overview',    to: '/',            icon: LayoutDashboard },
    { label: 'Gate',        to: '/gate',         icon: ScanLine },
    { label: 'Visitors',    to: '/visitors',     icon: UserCheck },
    { label: 'Alerts',      to: '/alerts',       icon: Bell },
    { section: 'Management' },
    { label: 'Users',       to: '/users',        icon: Users },
    { label: 'Bulk Import', to: '/bulk-import',  icon: FileSpreadsheet },
    { label: 'Guard Stats', to: '/guard-stats',  icon: BarChart2 },
    { label: 'Reports',     to: '/reports',      icon: FileBarChart },
    { section: 'Security' },
    { label: 'Lockdown',    to: '/lockdown',     icon: ShieldAlert },
    { label: 'Audit Log',   to: '/audit-log',    icon: ClipboardList },
  ],
  guard: [
    { section: 'Operations' },
    { label: 'Gate',     to: '/gate',     icon: ScanLine },
    { label: 'Visitors', to: '/visitors', icon: UserCheck },
    { label: 'Alerts',   to: '/alerts',   icon: Bell },
  ],
  student:  [{ section: 'My Account' }, { label: 'My Portal', to: '/portal', icon: DoorOpen }],
  staff:    [{ section: 'My Account' }, { label: 'My Portal', to: '/portal', icon: DoorOpen }],
  lecturer: [{ section: 'My Account' }, { label: 'My Portal', to: '/portal', icon: DoorOpen }],
};

// Bugema University logo — loaded from official URL
const BugemaLogo = () => (
  <img
    src="https://tse1.mm.bing.net/th/id/OIP.HY_J4rnKvGBpldYn43mY1AAAAA?r=0&cb=thfvnext&rs=1&pid=ImgDetMain&o=7&rm=3"
    alt="Bugema University"
    style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4 }}
    onError={e => {
      // Fallback to initials if image fails to load
      e.target.style.display = 'none';
      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
    }}
  />
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user?.role] || NAV.student;

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-lockup">
          {/* Bugema University logo */}
          <div className="sidebar-logo-icon" style={{ background: 'white', padding: 2 }}>
            <BugemaLogo />
          </div>
          <div>
            <div className="sidebar-logo-text">CampusGuard</div>
            <div className="sidebar-logo-sub">Bugema University</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <item.icon size={15} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar
            userId={user?.id}
            name={user?.full_name}
            size="thumb"
            px={34}
            fontSize={11}
            style={{ border: '1.5px solid rgba(200,150,62,0.3)' }}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="sidebar-user-name">{user?.full_name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button onClick={handleLogout} title="Sign out"
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:6, display:'flex', minHeight:32, alignItems:'center' }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
