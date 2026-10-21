import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';
import axios from 'axios';

const AuthCtx = createContext(null);

const DEMO_USERS = {
  'admin':   { id: 1, full_name: 'Admin User',        role: 'admin',   reg_number: 'ADM/001' },
  'guard':   { id: 2, full_name: 'Moses Kiggundu',     role: 'guard',   reg_number: 'GRD/003' },
  'student': { id: 3, full_name: 'Lwano Abdoul Karim', role: 'student', reg_number: '23/BIT/BU/R/0017' },
  'staff':   { id: 4, full_name: 'Grace Nakato',       role: 'staff',   reg_number: 'STF/008' },
};
const DEMO_PWD = {
  'admin': 'admin123', 'guard': 'guard123',
  'student': 'student123', 'staff': 'staff123',
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cg_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Try real backend first
    try {
      const { data } = await apiLogin(username, password);
      const u = data.user;
      localStorage.setItem('cg_token',   data.access_token);
      localStorage.setItem('cg_refresh', data.refresh_token);
      localStorage.setItem('cg_user',    JSON.stringify(u));
      setUser(u);
      return u;
    }
     catch (err) {
      // If backend is down (network error), fall back to demo
      if (!err.response) {
        const key = username.toLowerCase();
        if (DEMO_USERS[key] && DEMO_PWD[key] === password) {
          const u = DEMO_USERS[key];
          localStorage.setItem('cg_token',   'demo-token');
          localStorage.setItem('cg_refresh', 'demo-refresh');
          localStorage.setItem('cg_user',    JSON.stringify(u));
          setUser(u);
          return u;
        }
      }
      // Backend returned 401 or other error — wrong credentials
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('cg_refresh');
      if (refresh && refresh !== 'demo-refresh') {
        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/logout`,
          { refresh_token: refresh }
        );
      }
    } catch {}
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
