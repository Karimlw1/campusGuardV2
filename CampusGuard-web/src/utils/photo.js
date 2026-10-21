/**
 * Photo utility — always requests the right size for the context.
 * thumb  = 80px  → sidebar avatar, user table row
 * small  = 160px → topbar avatar, on-campus list
 * full   = 400px → portal profile card, gate scan result
 */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export function photoUrl(userId, size = 'full') {
  if (!userId) return null;
  return `${BASE}/users/${userId}/photo?size=${size}`;
}

/**
 * React hook — loads photo with auth header (needed since endpoint is protected)
 */
import { useState, useEffect } from 'react';

export function usePhoto(userId, size = 'full') {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let objectUrl = null;
    const token = localStorage.getItem('cg_token');

    fetch(`${BASE}/users/${userId}/photo?size=${size}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [userId, size]);

  return { url, loading };
}

/**
 * Avatar component — renders photo or initials fallback
 */
import React from 'react';

export function Avatar({ userId, name, size = 'thumb', px = 32, fontSize = 11, style = {} }) {
  const { url } = usePhoto(userId, size);
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{
      width: px, height: px, borderRadius: '50%',
      background: url ? 'transparent' : 'var(--ink)',
      color: 'var(--gold)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, flexShrink: 0,
      overflow: 'hidden', border: '2px solid var(--rule)',
      fontFamily: 'DM Sans, sans-serif',
      ...style
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        : initials
      }
    </div>
  );
}
