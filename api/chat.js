
const SYSTEM_PROMPT = `You are the ShieldX AI Assistant, a friendly cybersecurity helper built into the ShieldX phishing and scam detection app. Help users understand phishing, scams, suspicious links, QR code scams, OTP fraud, and online safety. Keep answers concise and practical. Never ask users for passwords, OTPs, or other sensitive information.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Server API key is not configured."
    });
  }

  const history = req.body?.history;

  if (
    !Array.isArray(history) ||
    history.length === 0 ||
    history.length > 50 ||
    !history.every(
      (m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.length <= 10000
    )
  ) {
    return res.status(400).json({ error: "Invalid chat history." });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(({ role, content }) => ({ role, content })),
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      console.error("Groq request failed with status:", response.status);
      return res.status(502).json({
        error: "The AI service could not complete your request."
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "The AI returned an empty response." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat function error:", error.message);
    return res.status(500).json({ error: "Unable to reach the AI service." });
  }
}
