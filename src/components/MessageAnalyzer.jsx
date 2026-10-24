import { useState } from 'react';
import { analyzeMessageFull } from '../lib/scanEngine.js';
import ResultCard from './ResultCard.jsx';

export default function MessageAnalyzer({ onScan }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    const val = value.trim();
    if (!val || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeMessageFull(val);
      setResult(res);
      onScan(res.level, 'Message analyzed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>Message Analyzer</h2>
          <p>Paste a WhatsApp, SMS, Email, Telegram or Discord message to analyze it</p>
        </div>
      </div>
      <div className="card">
        <h3>Message Text</h3>
        <textarea
          placeholder="Paste the suspicious message here..."
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <div className="row">
          <button className="btn" onClick={scan} disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze Message'}
          </button>
        </div>
        {result && <ResultCard result={result} urlBreakdown={result.urlResults} />}
      </div>
    </div>
  );
}
