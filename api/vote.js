// People's Vote — the third board, never mixed into Human or Panel scores.
// One Vercel function backed by Neon (serverless Postgres over HTTP).
// Every vote is a ROW, not an opaque counter — auditable, recountable,
// exportable as receipts, and ready to feed the v2 score blend.
//
// Provisioning: Vercel dashboard → Storage → Neon → connect to this project
// (injects DATABASE_URL). Until then this returns 503 and the site's vote UI
// stays hidden. Optionally set VOTE_SALT to any random string.
//
//   GET  /api/vote?ping=1          → { up: true }
//   GET  /api/vote?match=<id>      → { a: <count>, b: <count> }
//   POST /api/vote {match, choice} → { counted: true } | 429 if already voted
//
// Abuse posture: one vote per (IP-hash, match), forever — a ballot, not a
// daily poll. Counts shown raw. Revisit if it ever gets brigaded.

import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
const SALT = process.env.VOTE_SALT || 'beckon-bench-v1';
const MATCH_RE = /^[\w.-]{1,160}$/;

const sql = URL ? neon(URL) : null;

// Lazy one-time schema setup per cold start. CREATE IF NOT EXISTS is cheap
// and beats dragging migration tooling into a one-table repo.
let ready;
const ensureSchema = () =>
  (ready ??= sql`CREATE TABLE IF NOT EXISTS votes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match text NOT NULL,
    choice text NOT NULL CHECK (choice IN ('a', 'b')),
    voter text NOT NULL,
    voted_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (match, voter)
  )`);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sql) return res.status(503).json({ error: 'voting not configured' });
  await ensureSchema();

  if (req.method === 'GET') {
    if (req.query.ping) return res.status(200).json({ up: true });
    const match = String(req.query.match || '');
    if (!MATCH_RE.test(match)) return res.status(400).json({ error: 'bad match id' });
    const rows = await sql`SELECT choice, count(*)::int AS n FROM votes WHERE match = ${match} GROUP BY choice`;
    const tally = { a: 0, b: 0 };
    for (const r of rows) tally[r.choice] = r.n;
    return res.status(200).json(tally);
  }

  if (req.method === 'POST') {
    const { match, choice } = req.body ?? {};
    if (!MATCH_RE.test(String(match)) || !['a', 'b'].includes(choice))
      return res.status(400).json({ error: 'bad vote' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const voter = createHash('sha256').update(`${SALT}|${ip}|${match}`).digest('hex').slice(0, 32);
    const inserted = await sql`INSERT INTO votes (match, choice, voter) VALUES (${match}, ${choice}, ${voter})
      ON CONFLICT (match, voter) DO NOTHING RETURNING id`;
    if (!inserted.length) return res.status(429).json({ error: 'already voted on this match' });
    return res.status(200).json({ counted: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
