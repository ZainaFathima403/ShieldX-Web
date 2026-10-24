import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import UrlScanner from './components/UrlScanner.jsx';
import QrScanner from './components/QrScanner.jsx';
import MessageAnalyzer from './components/MessageAnalyzer.jsx';
import ScreenshotScanner from './components/ScreenshotScanner.jsx';
import AiAssistant from './components/AiAssistant.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({ threats: 0, scans: 0, warn: 0, score: 100 });
  const [activity, setActivity] = useState([]);

  function recordScan(level, label) {
    setStats(prev => {
      let { threats, scans, warn, score } = prev;
      scans += 1;
      if (level === 'danger') { threats += 1; warn += 1; score = Math.max(10, score - 8); }
      else if (level === 'warn') { warn += 1; score = Math.max(30, score - 3); }
      else { score = Math.min(100, score + 1); }
      return { threats, scans, warn, score };
    });
    setActivity(prev => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label, level, time: new Date().toLocaleTimeString() },
      ...prev,
    ].slice(0, 8));
  }

  function clearAllActivity() {
    setActivity([]);
  }

  function removeActivityItem(id) {
    setActivity(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="app">
      <Sidebar active={tab} onChange={setTab} />
      <div className="main">
        {tab === 'dashboard' && (
          <Dashboard
            stats={stats}
            activity={activity}
            onClearAll={clearAllActivity}
            onRemoveItem={removeActivityItem}
          />
        )}
        {tab === 'url' && <UrlScanner onScan={recordScan} />}
        {tab === 'qr' && <QrScanner onScan={recordScan} />}
        {tab === 'msg' && <MessageAnalyzer onScan={recordScan} />}
        {tab === 'shot' && <ScreenshotScanner onScan={recordScan} />}
        {tab === 'ai' && <AiAssistant />}
      </div>
    </div>
  );
}
