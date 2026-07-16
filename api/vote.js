// People's Vote — the third board, never mixed into Human or Panel scores.
// One Vercel function, zero dependencies. Storage is Upstash Redis over REST
// (Vercel KV works too — both env var pairs accepted). Until the store is
// provisioned this returns 503 and the site's vote UI stays hidden.
//
// Provisioning: Vercel dashboard → Storage → create KV/Upstash → link to the
// project. Optionally set VOTE_SALT to any random string.
//
//   GET  /api/vote?ping=1          → { up: true }
//   GET  /api/vote?match=<id>      → { a: <count>, b: <count> }
//   POST /api/vote {match, choice} → { counted: true } | 429 if already voted
//
// Abuse posture (v1): one vote per (IP-hash, match) per day, counts shown raw.
// Good enough for launch; revisit if it ever gets brigaded.

import { createHash } from 'node:crypto';

const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SALT = process.env.VOTE_SALT || 'beckon-bench-v1';
const MATCH_RE = /^[\w.-]{1,160}$/;

async function redis(...cmd) {
  const res = await fetch(`${BASE}/${cmd.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  return (await res.json()).result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!BASE || !TOKEN) return res.status(503).json({ error: 'voting not configured' });

  if (req.method === 'GET') {
    if (req.query.ping) return res.status(200).json({ up: true });
    const match = String(req.query.match || '');
    if (!MATCH_RE.test(match)) return res.status(400).json({ error: 'bad match id' });
    const [a, b] = await Promise.all([redis('GET', `v:${match}:a`), redis('GET', `v:${match}:b`)]);
    return res.status(200).json({ a: Number(a) || 0, b: Number(b) || 0 });
  }

  if (req.method === 'POST') {
    const { match, choice } = req.body ?? {};
    if (!MATCH_RE.test(String(match)) || !['a', 'b'].includes(choice))
      return res.status(400).json({ error: 'bad vote' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const voter = createHash('sha256').update(`${SALT}|${ip}|${match}`).digest('hex').slice(0, 32);
    const fresh = await redis('SET', `voter:${voter}`, '1', 'NX', 'EX', '86400');
    if (fresh !== 'OK') return res.status(429).json({ error: 'already voted today' });
    await redis('INCR', `v:${match}:${choice}`);
    return res.status(200).json({ counted: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
