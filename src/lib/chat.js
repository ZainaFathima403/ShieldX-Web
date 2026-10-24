

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';

const SYSTEM_PROMPT = `You are the ShieldX AI Assistant, a friendly cybersecurity helper built into the
ShieldX phishing & scam detection app. You help users understand phishing, scams, suspicious links,
QR code scams, OTP fraud, and general online safety. Keep answers concise, practical, and non-technical
unless the user asks for technical detail. If a user pastes a URL or message, remind them they can also
run it through ShieldX's URL Scanner or Message Analyzer tabs for an automated risk score. Never ask the
user for passwords, OTPs, or other sensitive info yourself.`;

export async function sendChatMessage(history) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('MISSING_API_KEY');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
  const errText = await response.text().catch(() => '');

  console.error('Groq API error:', response.status, errText);

  throw new Error(`API_ERROR: ${response.status} ${errText}`);
}
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a reply — please try again.";
}
