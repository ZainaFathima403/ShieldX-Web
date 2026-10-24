export default function Dashboard({ stats, activity, onClearAll, onRemoveItem }) {
  const statusLabel = stats.score >= 80 ? '🟢 Protected' : stats.score >= 50 ? '🟡 At Risk' : '🔴 High Risk';

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>Dashboard</h2>
          <p>Your protection overview</p>
        </div>
        <div className="pill">{statusLabel}</div>
      </div>

      <div className="grid">
        <div className="stat danger"><div className="n">{stats.threats}</div><div className="l">Threats Blocked</div></div>
        <div className="stat"><div className="n">{stats.scans}</div><div className="l">Scans Today</div></div>
        <div className="stat safe"><div className="n">{stats.score}</div><div className="l">Safety Score</div></div>
        <div className="stat warn"><div className="n">{stats.warn}</div><div className="l">Suspicious Flags</div></div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activity.length ? 10 : 0 }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          {activity.length > 0 && (
            <span
              onClick={onClearAll}
              style={{ color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}
            >
              Clear All
            </span>
          )}
        </div>
        {activity.length === 0 ? (
          <div className="small">No scans yet — try the URL Scanner, QR Scanner, or Message Analyzer.</div>
        ) : (
          activity.map((a) => (
            <div className="activity" key={a.id}>
              <div><span className={`badge ${a.level}`}>{a.level.toUpperCase()}</span>&nbsp; {a.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="small">{a.time}</span>
                <span
                  onClick={() => onRemoveItem(a.id)}
                  title="Remove"
                  style={{ color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}
                >
                  ✕
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
