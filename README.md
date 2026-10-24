# ShieldX — Phishing & Scam Detector (Web App)

A React + Vite web app: URL Scanner, QR Scanner, Message Analyzer, Screenshot Scanner (OCR), and a real
AI chatbot Assistant.

## Run it in VS Code

1. Open this folder in VS Code.
2. Open a terminal (`` Ctrl+` ``) and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open the URL it prints (usually `http://localhost:5173`).

## Set up the AI Assistant (free, ~1 minute)

The AI Assistant is a **real chatbot**, not pre-written answers — it calls an actual LLM. It uses
[Groq](https://console.groq.com/keys), which has a free tier fast enough for chat and needs no credit card.

1. Go to https://console.groq.com/keys and sign up.
2. Click **Create API Key**, copy it.
3. In this project, duplicate `.env.example` and rename the copy to `.env`.
4. Paste your key in: `VITE_GROQ_API_KEY=gsk_...`
5. Restart `npm run dev`.


> Want to use a different provider instead (OpenAI, OpenRouter, Google Gemini, etc.)? Everything the
> chatbot needs lives in `src/lib/chat.js` — swap the `API_URL`, `MODEL`, and the `Authorization` header
> to match your provider's docs; most are OpenAI-compatible so the rest of the code won't need to change.

## Set up real threat-database checking (free, ~2 minutes)

By default, the URL/QR/Message/Screenshot scanners only use local pattern heuristics — good at catching
obviously-shaped scams, but a hand-picked fake link can dodge every pattern check. Adding a free
**Google Safe Browsing** key checks every link against Google's real, constantly-updated database of
known phishing and malware sites — the same database Chrome itself uses.

1. Go to https://console.cloud.google.com/apis/credentials (sign in with any Google account).
2. If prompted, create a new project (any name is fine, e.g. "shieldx").
3. Go to https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com and click **Enable**.
4. Back on the Credentials page, click **+ Create Credentials → API key**.
5. Copy the key it gives you.
6. In your `.env` file, paste it in: `VITE_GOOGLE_SAFE_BROWSING_KEY=AIza...`
7. Restart `npm run dev`.

Without this key, ShieldX still works — it just tells you a result is "heuristic only" instead of
cross-checked. Each scan result shows which mode was used.

## Project structure

```
src/
  lib/
    scanEngine.js     — URL & message risk-scoring heuristics (no API needed)
    chat.js           — real LLM chatbot client (Groq API)
  components/
    Sidebar.jsx
    Dashboard.jsx
    UrlScanner.jsx
    QrScanner.jsx           — decodes QR images client-side with jsQR
    MessageAnalyzer.jsx
    ScreenshotScanner.jsx   — OCR client-side with tesseract.js
    AiAssistant.jsx         — chat UI, calls lib/chat.js
    ResultCard.jsx          — shared risk result display
  App.jsx              — tab routing + shared stats/activity state
  index.css            — dark theme shared across all screens
```

## Build for production

```bash
npm run build
```
Outputs static files to `dist/` — deployable to any static host (Vercel, Netlify, GitHub Pages, etc.).

## Notes

- URL/QR/Message/Screenshot scanning runs **entirely client-side** — no API key, no server, no data leaves
  the browser.
- Only the AI Assistant chat calls an external API (Groq), and only when you actually send a message.
- This is a browser web app: it can't intercept links tapped in other apps on your phone/desktop. For that,
  see the ShieldX Chrome extension (desktop) or the ShieldX Android app (mobile) built earlier.
