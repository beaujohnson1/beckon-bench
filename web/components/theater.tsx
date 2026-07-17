'use client';

// The Theater — PostHog's signature tabbed demo stage, Win95 dress, carrying
// the head-to-heads. Tabs are capabilities; the stage plays the comparison
// video; the side panel explains the verdicts and takes the visitor's vote.
import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScoreChip } from '@/components/score-chip';
import { VoteRow } from '@/components/vote-row';

export type TheaterPairing = {
  video: string;
  models: { slug: string; name: string; score: number | null }[];
  match: {
    id: string; aSlug: string; bSlug: string; aName: string; bName: string;
    winner: string; tally: string; quote?: string; judge?: string;
  } | null;
};
export type TheaterTest = { id: string; num: string; title: string; pairings: TheaterPairing[] };

function Stage({ t }: { t: TheaterTest }) {
  const [idx, setIdx] = useState(0);
  const p = t.pairings[idx];
  return (
    <div className="stage grid lg:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0 p-3">
        <video
          key={p.video}
          className="block w-full border border-border bg-black"
          controls muted loop playsInline preload="metadata"
          src={p.video}
        />
        {t.pairings.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {t.pairings.map((q, i) => (
              <button
                key={q.video}
                onClick={() => setIdx(i)}
                className={`px-2 py-1 font-mono text-[11px] ${i === idx ? 'bevel-in bg-muted' : 'bevel-out bg-background'}`}
              >
                {q.models.map((m) => m.name).join(' vs ')}
              </button>
            ))}
          </div>
        )}
      </div>
      <aside className="stage-side flex min-w-0 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {p.models.map((m, i) => (
            <span key={m.slug} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground">vs</span>}
              <Link href={`/model/${m.slug}/`} className="font-semibold hover:text-primary">{m.name}</Link>
              {m.score != null && <ScoreChip score={m.score} />}
            </span>
          ))}
        </p>
        {p.match && (
          <>
            <p className="flex items-center gap-2 text-sm">
              <Badge variant="info">AI panel</Badge>
              <b>{p.match.winner}</b>
              <span className="font-mono tabular-nums">{p.match.tally}</span>
            </p>
            {p.match.quote && (
              <p className="border-l-2 border-border pl-2 text-sm italic text-muted-foreground">
                “{p.match.quote}” <span className="not-italic">— {p.match.judge}</span>
              </p>
            )}
            <VoteRow
              matchId={p.match.id}
              aSlug={p.match.aSlug} bSlug={p.match.bSlug}
              aName={p.match.aName} bName={p.match.bName}
            />
          </>
        )}
        <p className="mt-auto flex gap-4 pt-2 font-mono text-xs">
          <Link href={`/test/${t.id}/`} className="text-muted-foreground hover:text-primary">Full result →</Link>
          <Link href="/matches/" className="text-muted-foreground hover:text-primary">All panel votes →</Link>
        </p>
      </aside>
    </div>
  );
}

export function Theater({ tests }: { tests: TheaterTest[] }) {
  if (!tests.length) return null;
  return (
    <Tabs defaultValue={tests[0].id}>
      <TabsList className="flex-wrap">
        {tests.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="font-mono text-xs">
            {t.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tests.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          <Stage t={t} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
