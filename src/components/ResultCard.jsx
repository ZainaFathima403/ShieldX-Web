const LABELS = { danger: 'Dangerous', warn: 'Suspicious', safe: 'Safe' };
const ICONS = { danger: '⛔', warn: '⚠️', safe: '✅' };
const COLORS = { danger: 'var(--danger)', warn: 'var(--warn)', safe: 'var(--safe)' };

export default function ResultCard({ result, subject, urlBreakdown }) {
  if (!result) return null;
  return (
    <div className={`result ${result.level}`}>
      <span className={`badge ${result.level}`}>
        {ICONS[result.level]} {LABELS[result.level]}
      </span>
      {subject && (
        <div style={{ marginTop: 10, fontSize: 13, wordBreak: 'break-all' }}>
          <b>{subject}</b>
        </div>
      )}
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${result.score}%`, background: COLORS[result.level] }} />
      </div>
      <div className="small">Threat score: {result.score}/100</div>
      <ul className="reasons">
        {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      {urlBreakdown && urlBreakdown.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {urlBreakdown.map((ur, i) => (
            <div key={i} className="small" style={{ marginBottom: 6, wordBreak: 'break-all' }}>
              <span className={`badge ${ur.res.level}`}>{ur.res.level}</span> {ur.url}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
