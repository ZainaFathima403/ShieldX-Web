// ShieldX detection engine — heuristic URL and message analysis.
// Pure functions, no dependencies, shared by every scanner in the app.

import { checkSafeBrowsing } from './safeBrowsing.js';

const SHORTENERS = ['bit.ly','tinyurl.com','t.co','goo.gl','ow.ly','is.gd','buff.ly','rebrand.ly','cutt.ly','shorturl.at'];
const SUSPICIOUS_TLDS = ['.zip','.mov','.xyz','.top','.gq','.tk','.ml','.cf','.ga','.icu','.click','.link','.work'];
const BAIT_WORDS = ['verify your account','urgent action','suspended','claim your prize','won a','limited time','confirm your identity','update payment','unusual activity','click here immediately','free gift','congratulations you','act now','security alert','password expired','otp','refund pending'];
const BRAND_KEYWORDS = ['paypal','amazon','apple','microsoft','google','netflix','bank','irs','instagram','facebook','whatsapp'];

export function analyzeUrl(raw) {
  const reasons = [];
  let score = 0;
  let url;
  try {
    url = new URL(raw.match(/^https?:\/\//i) ? raw : 'http://' + raw);
  } catch (e) {
    return { level: 'warn', score: 40, reasons: ['Could not parse this as a valid URL — double check it before using it.'] };
  }

  const host = url.hostname.toLowerCase();
  const full = raw.toLowerCase();

  if (!raw.match(/^https:\/\//i)) { score += 15; reasons.push('Connection is not secured with HTTPS.'); }
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) { score += 35; reasons.push('The domain is a raw IP address, a very common phishing pattern.'); }
  if (full.includes('@')) { score += 30; reasons.push('URL contains an "@" symbol, which can hide the real destination.'); }
  if ((host.match(/-/g) || []).length >= 3) { score += 15; reasons.push('Domain has an unusually high number of hyphens.'); }
  if (SHORTENERS.some(s => host.includes(s))) { score += 20; reasons.push('This is a link shortener — the real destination is hidden.'); }
  const tldHit = SUSPICIOUS_TLDS.find(t => host.endsWith(t));
  if (tldHit) { score += 20; reasons.push(`Domain uses a top-level domain (${tldHit}) frequently abused for scams.`); }
  if (host.split('.').length > 3) { score += 15; reasons.push('Domain has excessive subdomains, often used to disguise the true host.'); }
  const brandHit = BRAND_KEYWORDS.find(b => host.includes(b) && !host.endsWith(b + '.com'));
  if (brandHit) { score += 30; reasons.push(`Mentions the brand "${brandHit}" but is not on that brand's real domain — likely impersonation.`); }
  if (full.length > 90) { score += 10; reasons.push('Unusually long URL, often used to obscure a fake domain.'); }
  if (BAIT_WORDS.some(w => full.includes(w.split(' ')[0]))) { score += 10; reasons.push('URL path contains urgency/bait wording.'); }

  if (reasons.length === 0) reasons.push('No known phishing indicators detected. Always stay cautious with unfamiliar links.');

  const level = score >= 45 ? 'danger' : score >= 20 ? 'warn' : 'safe';
  return { level, score: Math.min(score, 100), reasons, host };
}

export function extractUrls(text) {
  return text.match(/((https?:\/\/|www\.)[^\s]+)/gi) || [];
}

export function analyzeMessage(text) {
  const reasons = [];
  let score = 0;
  const lower = text.toLowerCase();

  const hits = BAIT_WORDS.filter(w => lower.includes(w));
  if (hits.length) { score += hits.length * 12; reasons.push(`Contains urgency/bait phrasing: "${hits[0]}"${hits.length > 1 ? ` (+${hits.length - 1} more)` : ''}.`); }

  if (/\$|₹|money|payment|gift card|wire transfer|bitcoin|crypto|bank details|cvv|otp|pin number/i.test(text)) { score += 15; reasons.push('Message asks about money, payment details, or sensitive financial info.'); }
  if (/click here|tap here|link below|verify now/i.test(text)) { score += 10; reasons.push('Pushes you to click a link immediately.'); }
  if (/dear customer|dear user|valued customer/i.test(text)) { score += 8; reasons.push('Generic greeting instead of using your name — common in mass phishing.'); }
  if (text.split(' ').filter(w => w === w.toUpperCase() && w.length > 3).length >= 2) { score += 6; reasons.push('Excessive use of ALL CAPS to create urgency.'); }

  const urls = extractUrls(text);
  const urlResults = urls.map(u => ({ url: u, res: analyzeUrl(u) }));
  urlResults.forEach(ur => { if (ur.res.level === 'danger') score += 25; else if (ur.res.level === 'warn') score += 10; });
  if (urls.length) reasons.push(`Found ${urls.length} link(s) in the message — see breakdown below.`);

  if (reasons.length === 0) reasons.push('No strong phishing indicators found in the text. Still verify the sender independently.');

  const level = score >= 45 ? 'danger' : score >= 20 ? 'warn' : 'safe';
  return { level, score: Math.min(score, 100), reasons, urlResults };
}

/**
 * Combines the local heuristic score with a real Google Safe Browsing lookup.
 * If Safe Browsing flags the URL, the result is forced to "danger" regardless of the
 * heuristic score, since a real-world threat-intel match is far more reliable than
 * pattern-matching alone. Falls back to heuristics-only if no API key is configured
 * or the request fails.
 */
export async function analyzeUrlFull(raw) {
  const heuristic = analyzeUrl(raw);
  const sb = await checkSafeBrowsing(raw.match(/^https?:\/\//i) ? raw : 'http://' + raw);

  if (sb.checked && sb.flagged) {
    return {
      ...heuristic,
      level: 'danger',
      score: 100,
      reasons: [
        `Flagged by Google Safe Browsing as: ${sb.threatTypes.join(', ').toLowerCase().replace(/_/g, ' ')}.`,
        ...heuristic.reasons,
      ],
      safeBrowsingChecked: true,
    };
  }

  return { ...heuristic, safeBrowsingChecked: sb.checked };
}

/** Same as analyzeMessage, but also runs each embedded URL through Safe Browsing. */
export async function analyzeMessageFull(text) {
  const base = analyzeMessage(text);
  if (!base.urlResults || base.urlResults.length === 0) return base;

  const upgraded = await Promise.all(
    base.urlResults.map(async ur => ({ url: ur.url, res: await analyzeUrlFull(ur.url) }))
  );

  let score = base.score;
  const reasons = [...base.reasons];
  upgraded.forEach(ur => {
    if (ur.res.safeBrowsingChecked && ur.res.level === 'danger' && ur.res.score === 100) {
      score = 100;
      reasons.unshift(`One of the links is flagged by Google Safe Browsing.`);
    }
  });

  const level = score >= 45 ? 'danger' : score >= 20 ? 'warn' : 'safe';
  return { ...base, level, score: Math.min(score, 100), reasons, urlResults: upgraded };
}
