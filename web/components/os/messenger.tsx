'use client';

// B.I.M. — Bench Instant Messenger. The 1999 buddy-list experience with
// original art: collapsible groups, away messages, and an IM window where
// Beckon (a CRT of few words) actually replies. Buddies are REAL — Discord's
// widget JSON lists who's online in Shipyard right now. The running man and
// the flower belong to other people; the vibes belong to everyone.
const GUILD_ID = '1526458247936999578';
const INVITE = 'https://discord.gg/5C8Gwj3MVa';

import { useEffect, useRef, useState } from 'react';
import { useDrag } from './use-drag';
import { PixelIcon } from './icons';

type Buddy = { name: string; status: string; away?: string };
export type BenchStats = { leader: string; elo: number | null; ballots: number };

const DOT: Record<string, string> = {
  online: '#2e8b57', idle: '#a8842f', dnd: '#c0281e', offline: '#808080',
};

// two-tone incoming-message blip (original — no "uh oh" was harmed)
function blip() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const g = ctx.createGain(); g.gain.value = 0.06; g.connect(ctx.destination);
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.setValueAtTime(1, ctx.currentTime + i * 0.09);
      og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.12);
      o.connect(og).connect(g);
      o.start(ctx.currentTime + i * 0.09); o.stop(ctx.currentTime + i * 0.09 + 0.15);
    });
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

function beckonReplies(stats: BenchStats): string[] {
  return [
    `sup. i'm a CRT holding a keyboard. state your business`,
    stats.elo != null
      ? `leader right now is ${stats.leader} at ${stats.elo} elo. don't tell the others`
      : `the arena is warming up. judges are stretching`,
    `${stats.ballots} ballots are open. your click matters. allegedly`,
    `brb, rendering a donut`,
    `have you clicked bonsai buddy? don't. (do)`,
    `the vote page is the ballot box icon. i watched them build it`,
    `i don't sleep. i just dim to 40% brightness`,
    `every score here is public. i have receipts. literally, in notepad`,
  ];
}

function IMWindow({ stats, onClose }: { stats: BenchStats; onClose: () => void }) {
  const { pos, handlers } = useDrag();
  const [log, setLog] = useState<{ who: 'you' | 'beckon'; text: string }[]>([
    { who: 'beckon', text: 'oh hey. you found the IM button' },
  ]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const replyIdx = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { scroller.current?.scrollTo(0, 1e9); }, [log, typing]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setLog((l) => [...l, { who: 'you', text }]);
    setTyping(true);
    const replies = beckonReplies(stats);
    const reply = replies[replyIdx.current % replies.length];
    replyIdx.current += Math.floor(Math.random() * 2) + 1;
    setTimeout(() => {
      setTyping(false);
      setLog((l) => [...l, { who: 'beckon', text: reply }]);
      blip();
    }, 900 + Math.random() * 900);
  };

  return (
    <div
      className="fixed bottom-40 right-24 z-[70] w-80"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="bevel-out bg-background p-1">
        <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-0.5" {...handlers}>
          <PixelIcon name="beckon" size={14} />
          <span className="font-mono text-xs font-bold">Beckon — Instant Message</span>
          <button className="os-titlebar-btn ml-auto" onClick={onClose}>✕</button>
        </div>
        <div ref={scroller} className="bevel-field m-0.5 h-44 overflow-y-auto p-2 text-sm">
          {log.map((m, i) => (
            <p key={i} className="leading-snug">
              <b className={m.who === 'you' ? 'text-[#c0281e]' : 'text-[#000080]'}>
                {m.who === 'you' ? 'you' : 'Beckon'}:
              </b>{' '}
              {m.text}
            </p>
          ))}
          {typing && <p className="text-xs italic text-muted-foreground">Beckon is typing…</p>}
        </div>
        <div className="flex gap-1 p-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="type a message"
            className="bevel-field min-w-0 flex-1 px-2 py-1 text-sm outline-none"
          />
          <button className="bevel-out bg-background px-3 py-1 text-sm font-bold" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, buddies, defaultOpen = true, onBuddy }: {
  title: string; buddies: Buddy[]; defaultOpen?: boolean; onBuddy?: (b: Buddy) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button className="flex w-full items-center gap-1 py-0.5 text-left font-bold text-primary" onClick={() => setOpen(!open)}>
        <span className="font-mono text-xs">{open ? '▼' : '▶'}</span> {title} ({buddies.length})
      </button>
      {open && (
        <ul className="ml-4">
          {buddies.map((b) => (
            <li key={b.name}>
              <button
                className="flex w-full items-center gap-2 py-0.5 text-left hover:bg-muted"
                onDoubleClick={() => onBuddy?.(b)}
                onClick={() => onBuddy?.(b)}
                title={onBuddy ? 'Send instant message' : undefined}
              >
                <span className="h-2.5 w-2.5 shrink-0" style={{ background: DOT[b.status] ?? DOT.offline }} />
                <span className="truncate font-semibold text-[#000080] underline decoration-dotted underline-offset-2">
                  {b.name}
                </span>
                {b.away && <span className="truncate text-xs italic text-muted-foreground">{b.away}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Messenger({ state, stats, onMin, onClose }: {
  state: 'open' | 'min'; stats: BenchStats; onMin: () => void; onClose: () => void;
}) {
  const { pos, handlers } = useDrag();
  const [crew, setCrew] = useState<Buddy[] | null>(null);
  const [im, setIm] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        setCrew(
          (j.members ?? []).map((m: any) => ({
            name: m.username,
            status: m.status ?? 'online',
            away: m.game?.name ? `playing ${m.game.name}` : m.status === 'idle' ? 'away' : undefined,
          }))
        );
      } catch {
        setCrew([]);
      }
    })();
  }, []);

  const nudge = () => { setShake(true); setTimeout(() => setShake(false), 600); blip(); };
  const beckon: Buddy = { name: 'Beckon', status: 'online', away: 'holding a keyboard' };

  return (
    <>
      <div
        className={`fixed bottom-16 right-10 z-[60] w-72 ${state === 'min' ? 'hidden' : ''} ${shake ? 'animate-[shake_0.5s_linear]' : ''}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <div className="bevel-out bg-background p-1">
          <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-0.5" {...handlers}>
            <PixelIcon name="msn" size={16} />
            <span className="font-mono text-xs font-bold tracking-widest">B.I.M. — BUDDY LIST</span>
            <span className="ml-auto flex gap-0.5">
              <button className="os-titlebar-btn" onClick={onMin} title="Minimize">_</button>
              <button className="os-titlebar-btn" onClick={onClose} title="Close">✕</button>
            </span>
          </div>
          {/* the era-correct warm toolbar */}
          <div className="m-0.5 flex gap-1 border border-border bg-[#f4e8c1] px-1 py-1">
            <button className="bevel-out bg-background px-2 py-0.5 font-mono text-[11px] font-bold" onClick={() => setIm(true)}>
              IM
            </button>
            <a href={INVITE} target="_blank" rel="noopener noreferrer" className="bevel-out bg-background px-2 py-0.5 font-mono text-[11px] font-bold">
              Chat
            </a>
            <button className="bevel-out ml-auto bg-background px-2 py-0.5 font-mono text-[11px]" onClick={nudge}>
              Nudge!
            </button>
          </div>
          <div className="bevel-field m-0.5 max-h-72 overflow-y-auto p-2 text-sm">
            <Group title="Bench Crew" buddies={[beckon]} onBuddy={() => setIm(true)} />
            <Group
              title="Shipyard"
              buddies={crew ?? []}
              onBuddy={() => window.open(INVITE, '_blank', 'noopener')}
            />
            {crew === null && <p className="mt-1 text-xs text-muted-foreground">Ringing the server…</p>}
            {crew !== null && crew.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Everyone&apos;s behind the door — come on in.</p>
            )}
          </div>
          <p className="px-2 pb-1 text-[10px] text-muted-foreground">
            Shipyard buddies are live from Discord. Click one to join them.
          </p>
        </div>
      </div>
      {im && state === 'open' && <IMWindow stats={stats} onClose={() => setIm(false)} />}
    </>
  );
}
