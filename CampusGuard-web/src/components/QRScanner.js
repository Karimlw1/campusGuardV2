import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

export default function QRScanner({ onScan, active }) {
  const scannerRef = useRef(null);
  const [started, setStarted]   = useState(false);
  const [error, setError]       = useState('');
  const [cameras, setCameras]   = useState([]);
  const [camId, setCamId]       = useState(null);

  // Get available cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera on mobile, else first
          const back = devices.find(d => d.label.toLowerCase().includes('back'));
          setCamId((back || devices[0]).id);
        }
      })
      .catch(() => setError('Camera access denied. Allow camera in browser settings.'));
  }, []);

  // Start / stop when active prop changes
  useEffect(() => {
    if (active && camId && !started) startScanner();
    if (!active && started)         stopScanner();
  }, [active, camId]); // eslint-disable-line

  const startScanner = async () => {
    if (scannerRef.current) return;
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        camId,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText);
          // brief pause after each scan to avoid double-fires
          scanner.pause(true);
          setTimeout(() => { try { scanner.resume(); } catch {} }, 2000);
        },
        () => {} // ignore non-QR frames silently
      );
      setStarted(true);
      setError('');
    } catch (err) {
      setError('Could not start camera: ' + err.message);
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setStarted(false);
  };

  const toggle = () => { started ? stopScanner() : startScanner(); };

  return (
    <div>
      {/* Camera select if multiple */}
      {cameras.length > 1 && (
        <div className="form-group">
          <label className="form-label">Camera</label>
          <select className="form-select" value={camId || ''} onChange={e => { stopScanner(); setCamId(e.target.value); }}>
            {cameras.map(c => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
          </select>
        </div>
      )}

      {/* Viewfinder */}
      <div style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden',
        background: '#000', minHeight: started ? 0 : 180,
        border: '2px solid var(--navy-light)',
      }}>
        <div id="qr-reader" style={{ width: '100%' }} />
        {!started && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--navy)', color: 'var(--grey-300)', gap: 10,
          }}>
            <CameraOff size={36} color="var(--grey-500)" />
            <span style={{ fontSize: 13 }}>Camera off</span>
          </div>
        )}

        {/* Corner brackets overlay */}
        {started && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[['0','0','right','bottom'], ['0','auto','right','auto'], ['auto','0','auto','bottom'], ['auto','auto','auto','auto']].map(([t,b,r,l], i) => (
              <div key={i} style={{
                position: 'absolute', top: t === '0' ? 16 : 'auto', bottom: b === '0' ? 16 : 'auto',
                left: l === '0' ? 16 : 'auto', right: r === '0' ? 16 : 'auto',
                width: 28, height: 28,
                borderTop:    (t === '0') ? '3px solid var(--gold)' : 'none',
                borderBottom: (b === '0') ? '3px solid var(--gold)' : 'none',
                borderLeft:   (l === '0') ? '3px solid var(--gold)' : 'none',
                borderRight:  (r === '0') ? '3px solid var(--gold)' : 'none',
              }} />
            ))}
          </div>
        )}
      </div>

      {error && <div className="text-danger" style={{ fontSize: 12, marginTop: 8 }}>{error}</div>}

      <button
        className={`btn ${started ? 'btn-danger' : 'btn-gold'} mt-16`}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={toggle}
      >
        {started ? <><CameraOff size={14} /> Stop Camera</> : <><Camera size={14} /> Start Camera Scan</>}
      </button>

      {started && (
        <div style={{ fontSize: 11, color: 'var(--grey-500)', textAlign: 'center', marginTop: 8 }}>
          Point camera at student QR code — auto-detects
        </div>
      )}
    </div>
  );
}
