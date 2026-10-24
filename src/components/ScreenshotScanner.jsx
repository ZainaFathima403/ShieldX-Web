import { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { analyzeMessageFull } from '../lib/scanEngine.js';
import ResultCard from './ResultCard.jsx';

export default function ScreenshotScanner({ onScan }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [result, setResult] = useState(null);
  const [noText, setNoText] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    setNoText(false);
    setExtractedText('');
    setStatus('Reading text from image...');

    Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          setStatus(`Reading text… ${Math.round(m.progress * 100)}%`);
        }
      },
    })
      .then(async ({ data: { text } }) => {
        if (!text.trim()) {
          setNoText(true);
          setStatus('');
          return;
        }
        setExtractedText(text);
        setStatus('Checking against threat databases…');
        const res = await analyzeMessageFull(text);
        setResult(res);
        onScan(res.level, 'Screenshot analyzed');
        setStatus('');
      })
      .catch(() => setStatus('OCR failed — please try a different image.'));
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>Screenshot Scanner</h2>
          <p>Upload a screenshot of a message or email — text is extracted automatically and analyzed</p>
        </div>
      </div>
      <div className="card">
        <h3>Upload Screenshot</h3>
        <div className="dropzone" onClick={() => fileInputRef.current.click()}>
          📤 Click to upload a screenshot (PNG/JPG)
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        {status && <div className="small" style={{ marginTop: 10 }}>{status}</div>}

        {extractedText && (
          <div className="small" style={{ marginTop: 10 }}>
            <b>Extracted text:</b><br />
            <span style={{ color: 'var(--text-dim)' }}>{extractedText.slice(0, 400)}</span>
          </div>
        )}
        {result && <ResultCard result={result} urlBreakdown={result.urlResults} />}
        {noText && (
          <div className="result warn">
            <span className="badge warn">⚠️ No Text Found</span>
            <div className="small" style={{ marginTop: 8 }}>Could not read any text from this image. Try a clearer screenshot.</div>
          </div>
        )}
      </div>
    </div>
  );
}
