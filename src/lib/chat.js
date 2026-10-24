
export async function sendChatMessage(history) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ history }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The AI assistant is unavailable.");
  }

  return data.reply || "I couldn't generate a reply. Please try again.";
}
