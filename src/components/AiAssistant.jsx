import { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../lib/chat.js';

const WELCOME = "Hi! I'm the ShieldX assistant. Ask me anything about phishing, scams, or staying safe online.";

export default function AiAssistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  async function send() {
    const val = input.trim();
    if (!val || loading) return;

    const nextMessages = [...messages, { role: 'user', content: val }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(nextMessages);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      if (String(err.message).includes('MISSING_API_KEY')) {
        setKeyMissing(true);
        setMessages(m => [...m, {
          role: 'assistant',
          content: "I need a free Groq API key to think for real. Add VITE_GROQ_API_KEY to your .env file (see README.md), restart the dev server, and ask me again.",
        }]);
      } else {
        setMessages(m => [...m, {
          role: 'assistant',
          content: "Sorry, I couldn't reach the AI service just now. Please try again in a moment.",
        }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>AI Assistant</h2>
          <p>Ask about phishing, scams, and staying safe online</p>
        </div>
      </div>

      {keyMissing && (
        <div className="notice warn">
          No Groq API key found. See README.md for the 1-minute free setup — the assistant works with pre-written
          answers until then.
        </div>
      )}

      <div className="card">
        <div className="chat-box" ref={boxRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>
          ))}
          {loading && <div className="msg bot typing">Thinking…</div>}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button onClick={send} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}
