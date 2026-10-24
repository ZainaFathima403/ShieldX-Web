import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { analyzeUrlFull } from '../lib/scanEngine.js';
import ResultCard from './ResultCard.jsx';

export default function QrScanner({ onScan }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [decoded, setDecoded] = useState(null);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => stopCamera, []); // stop camera if the user navigates away from this tab

  function resetResults() {
    setNotFound(false);
    setResult(null);
    setDecoded(null);
  }

  async function handleDecoded(data) {
    setDecoded(data);
    setLoading(true);
    try {
      const res = await analyzeUrlFull(data);
      setResult(res);
      onScan(res.level, 'QR code scan');
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    resetResults();

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) handleDecoded(code.data);
      else setNotFound(true);
    };
    img.src = URL.createObjectURL(file);
  }

  async function startCamera() {
    resetResults();
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      scanLoop();
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera permission for this site and try again.'
          : 'Could not access the camera on this device.'
      );
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  function scanLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });

    if (code && code.data) {
      stopCamera();
      handleDecoded(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>QR Code Scanner</h2>
          <p>Scan with your camera, or upload a QR code image</p>
        </div>
      </div>
      <div className="card">
        <h3>Scan a QR Code</h3>

        <div className="row" style={{ marginBottom: 14 }}>
          {!cameraOn ? (
            <button className="btn" onClick={startCamera}>📷 Scan with Camera</button>
          ) : (
            <button className="btn secondary" onClick={stopCamera}>Stop Camera</button>
          )}
          <button className="btn secondary" onClick={() => fileInputRef.current.click()}>
            📤 Upload Image Instead
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {cameraError && (
          <div className="result warn">
            <span className="badge warn">⚠️ Camera Unavailable</span>
            <div className="small" style={{ marginTop: 8 }}>{cameraError}</div>
          </div>
        )}

        <div style={{ display: cameraOn ? 'block' : 'none', marginTop: 10 }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', maxWidth: 420, borderRadius: 12, border: '1px solid var(--border)' }}
          />
          <div className="small" style={{ marginTop: 8 }}>Point your camera at a QR code — it scans automatically.</div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {decoded && (
          <div className="small" style={{ marginTop: 14 }}>
            Decoded content: <code className="mono">{decoded}</code>
          </div>
        )}
        {loading && <div className="small" style={{ marginTop: 10 }}>Checking against threat databases…</div>}
        {result && <ResultCard result={result} subject={decoded} />}
        {notFound && (
          <div className="result warn">
            <span className="badge warn">⚠️ No QR Found</span>
            <div className="small" style={{ marginTop: 8 }}>Could not detect a QR code in this image. Try a clearer photo.</div>
          </div>
        )}
      </div>
    </div>
  );
}
