import { useState } from 'react';
import { analyzeUrlFull } from '../lib/scanEngine.js';
import ResultCard from './ResultCard.jsx';

export default function UrlScanner({ onScan }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    const val = value.trim();
    if (!val || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeUrlFull(val);
      setResult(res);
      onScan(res.level, `URL scan: ${(res.host || val).slice(0, 40)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>URL Scanner</h2>
          <p>Paste any link to check it for phishing signals</p>
        </div>
      </div>
      <div className="card">
        <h3>Enter URL</h3>
        <input
          type="text"
          placeholder="https://example.com/login"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && scan()}
        />
        <div className="row">
          <button className="btn" onClick={scan} disabled={loading}>
            {loading ? 'Scanning…' : 'Scan URL'}
          </button>
        </div>
        {result && <ResultCard result={result} subject={value} />}
        {result && (
          <div className="small" style={{ marginTop: 8 }}>
            {result.safeBrowsingChecked
              ? "Cross-checked against Google Safe Browsing's live threat database."
              : 'Heuristic check only — add a free Google Safe Browsing key (see README) for real threat-database matching.'}
          </div>
        )}
      </div>
    </div>
  );
}
