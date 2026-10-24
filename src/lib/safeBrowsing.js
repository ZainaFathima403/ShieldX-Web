// Calls Google's Safe Browsing API (free tier: 10,000 lookups/day, no cost, no card).
// Get a free key at https://console.cloud.google.com/apis/credentials after enabling the
// "Safe Browsing API" for a project — see README.md for the full walkthrough.
// This checks a URL against Google's real, constantly-updated database of known phishing,
// malware, and unwanted-software sites — something pattern-based heuristics alone can't do.

const API_BASE = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

/**
 * Returns { checked: boolean, flagged: boolean, threatTypes: string[] }
 * - checked=false means no API key was configured, or the request failed — caller should
 *   fall back to heuristics-only and not claim a Safe Browsing verdict was made.
 */
export async function checkSafeBrowsing(url) {
  const apiKey = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey || apiKey === 'your_safe_browsing_key_here') {
    return { checked: false, flagged: false, threatTypes: [] };
  }

  const body = {
    client: { clientId: 'shieldx-webapp', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const res = await fetch(`${API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { checked: false, flagged: false, threatTypes: [] };

    const data = await res.json();
    const matches = data.matches || [];
    return {
      checked: true,
      flagged: matches.length > 0,
      threatTypes: [...new Set(matches.map(m => m.threatType))],
    };
  } catch (e) {
    return { checked: false, flagged: false, threatTypes: [] };
  }
}
