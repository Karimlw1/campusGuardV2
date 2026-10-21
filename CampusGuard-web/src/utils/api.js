const BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8001';

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('cg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && token !== 'demo-token' ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };
  try {
    const res = await fetch(`${BASE}${path}`, { ...opts, headers });
    if (res.status === 401) {
      const refresh = localStorage.getItem('cg_refresh');
      if (refresh && refresh !== 'demo-refresh') {
        const rRes = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (rRes.ok) {
          const { access_token } = await rRes.json();
          localStorage.setItem('cg_token', access_token);
          const retry = await fetch(`${BASE}${path}`, {
            ...opts, headers: { ...headers, Authorization: `Bearer ${access_token}` },
          });
          return retry.ok ? retry.json() : null;
        }
      }
      localStorage.clear(); window.location.href = '/login'; return null;
    }
    return res.ok ? res.json() : null;
  } catch (e) {
    console.error(`[CampusGuard] ${path}:`, e.message);
    return null;
  }
}

export { BASE };
