import logo from '../assets/logo.png';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'url', icon: '🔗', label: 'URL Scanner' },
  { id: 'qr', icon: '▦', label: 'QR Scanner' },
  { id: 'msg', icon: '💬', label: 'Message Analyzer' },
  { id: 'shot', icon: '🖼️', label: 'Screenshot Scanner' },
  { id: 'ai', icon: '🤖', label: 'AI Assistant' },
];

export default function Sidebar({ active, onChange }) {
  return (
    <div className="sidebar">
      <div className="brand">
        <img src={logo} alt="ShieldX" className="logo-img" />
        <div>
          <h1>ShieldX</h1>
          <span>Threat Protection</span>
        </div>
      </div>
      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          <span className="ic">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}
