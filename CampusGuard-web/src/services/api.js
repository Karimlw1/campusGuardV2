import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
});

// Attach token to every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cg_token');
  if (token && token !== 'demo-token') {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Auto-refresh on 401 - but don't loop on auth routes
API.interceptors.response.use(
  r => r,
  async err => {
    const isAuthRoute = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthRoute) {
      const refresh = localStorage.getItem('cg_refresh');
      if (refresh && refresh !== 'demo-refresh') {
        try {
          const { data } = await axios.post(
            `${API.defaults.baseURL}/auth/refresh`,
            { refresh_token: refresh }
          );
          localStorage.setItem('cg_token', data.access_token);
          err.config.headers.Authorization = `Bearer ${data.access_token}`;
          return API(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const login = (username, password) =>
  API.post('/auth/login', { username, password });

export const logout = () => {
  const refresh = localStorage.getItem('cg_refresh');
  if (refresh && refresh !== 'demo-refresh') {
    return API.post('/auth/logout', { refresh_token: refresh });
  }
  return Promise.resolve();
};

// ── Dashboard ─────────────────────────────────────────
export const getDashboardStats = () => API.get('/dashboard/stats');
export const getRecentActivity  = () => API.get('/entries?limit=10');

// ── Users ─────────────────────────────────────────────
export const getUsers    = (params) => API.get('/users', { params });
export const getUser     = (id)     => API.get(`/users/${id}`);
export const createUser  = (data)   => API.post('/users', data);
export const updateUser  = (id, d)  => API.put(`/users/${id}`, d);
export const deleteUser  = (id)     => API.delete(`/users/${id}`);
export const getUserQR   = (id)     => API.get(`/users/${id}/qr`, { responseType: 'blob' });
export const searchPerson= (q)      => API.get(`/users/search?q=${q}`);

// ── Gates ─────────────────────────────────────────────
export const getGates   = ()      => API.get('/gates');
export const scanQR     = (data)  => API.post('/gates/scan', data);
export const admitEntry = (data)  => API.post('/gates/admit', data);

// ── Entries ───────────────────────────────────────────
export const getEntries = (params) => API.get('/entries', { params });

// ── Visitors ──────────────────────────────────────────
export const getVisitors     = ()     => API.get('/visitors');
export const createVisitor   = (data) => API.post('/visitors', data);
export const checkoutVisitor = (id)   => API.patch(`/visitors/${id}/checkout`);

// ── Alerts ────────────────────────────────────────────
export const getAlerts    = ()   => API.get('/alerts');
export const resolveAlert = (id) => API.patch(`/alerts/${id}/resolve`);

// ── Reports ───────────────────────────────────────────
export const generateReport = (params) =>
  API.get('/reports/generate', { params, responseType: 'blob' });

export default API;