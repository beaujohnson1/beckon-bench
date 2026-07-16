'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// People's Vote row. Hidden until /api/vote responds (per Ruling #6 the vote
// backend is the verdict machinery — this component only reads tallies and
// forwards a visitor's choice; it never fabricates or adjusts counts).
const API = process.env.NEXT_PUBLIC_VOTE_API ?? 'https://www.beckonbench.com/api/vote';

export function VoteRow({ matchId, aSlug, bSlug, aName, bName }: {
  matchId: string; aSlug: string; bSlug: string; aName: string; bName: string;
}) {
  const [up, setUp] = useState(false);
  const [tally, setTally] = useState<{ a: number; b: number } | null>(null);
  const [voted, setVoted] = useState(false);

  const refresh = async () => {
    try {
      const r = await fetch(`${API}?match=${encodeURIComponent(matchId)}`);
      if (r.ok) setTally(await r.json());
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        if (!(await fetch(`${API}?ping=1`)).ok) return;
      } catch { return; }
      setUp(true);
      setVoted(!!localStorage.getItem('vote:' + matchId));
      refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  if (!up) return null;

  const cast = async (choice: 'a' | 'b') => {
    setVoted(true);
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match: matchId, choice }),
      });
      localStorage.setItem('vote:' + matchId, choice);
      refresh();
    } catch {}
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted">
        People&apos;s vote
      </span>
      <div className="flex items-center gap-2">
        <Button disabled={voted} onClick={() => cast('a')}>{aName}</Button>
        <span className="font-mono text-sm tabular-nums text-muted">
          {tally ? `${tally.a} — ${tally.b}` : '· — ·'}
        </span>
        <Button disabled={voted} onClick={() => cast('b')}>{bName}</Button>
      </div>
    </div>
  );
}
