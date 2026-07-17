'use client';

// Bench Messenger — a buddy list straight out of 1999 (original art; the
// butterfly and the little running man belong to other people). Buddies are
// REAL: Discord's public widget JSON lists who's online in the server right
// now. If the widget is disabled, Beckon holds the fort alone.
//
// Enable in Discord: Server Settings → Widget → Enable Server Widget.
const GUILD_ID = '1526458247936999578';
const INVITE = 'https://discord.gg/5C8Gwj3MVa';

import { useEffect, useState } from 'react';
import { useDrag } from './use-drag';
import { PixelIcon } from './icons';

type Buddy = { name: string; status?: string };

export function Messenger({ state, onMin, onClose }: {
  state: 'open' | 'min'; onMin: () => void; onClose: () => void;
}) {
  const { pos, handlers } = useDrag();
  const [buddies, setBuddies] = useState<Buddy[] | null>(null);
  const [live, setLive] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        setLive(true);
        setBuddies(
          (j.members ?? []).map((m: any) => ({
            name: m.username,
            status: m.game?.name ? `playing ${m.game.name}` : m.status,
          }))
        );
      } catch {
        setBuddies([]);
      }
    })();
  }, []);

  const nudge = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  return (
    <div
      className={`fixed bottom-16 right-10 z-[60] w-64 ${state === 'min' ? 'hidden' : ''} ${shake ? 'animate-[shake_0.5s_linear]' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="bevel-out bg-background p-1">
        <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-0.5" {...handlers}>
          <PixelIcon name="msn" size={16} />
          <span className="font-mono text-xs font-bold tracking-widest">BENCH MESSENGER</span>
          <span className="ml-auto flex gap-0.5">
            <button className="os-titlebar-btn" onClick={onMin} title="Minimize">_</button>
            <button className="os-titlebar-btn" onClick={onClose} title="Close">✕</button>
          </span>
        </div>
        <div className="bevel-field m-0.5 max-h-72 overflow-y-auto p-2 text-sm">
          <p className="font-bold text-primary">✦ Online</p>
          <ul className="mt-1">
            <li className="flex items-center gap-2 py-0.5">
              <span className="h-2.5 w-2.5 bg-[#2e8b57]" />
              <span className="font-semibold">Beckon</span>
              <span className="truncate text-xs text-muted-foreground">— holding a keyboard</span>
            </li>
            {(buddies ?? []).map((b) => (
              <li key={b.name} className="flex items-center gap-2 py-0.5">
                <span className="h-2.5 w-2.5 bg-[#2e8b57]" />
                <span className="truncate font-semibold">{b.name}</span>
                {b.status && <span className="truncate text-xs text-muted-foreground">— {b.status}</span>}
              </li>
            ))}
          </ul>
          {buddies === null && <p className="mt-2 text-xs text-muted-foreground">Ringing the server…</p>}
          {buddies !== null && !live && (
            <p className="mt-2 text-xs text-muted-foreground">
              The rest of the crew is behind the door — come on in.
            </p>
          )}
        </div>
        <div className="flex gap-1 p-1">
          <a
            href={INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="bevel-out flex-1 bg-background px-2 py-1 text-center text-sm font-bold"
          >
            Join the chat
          </a>
          <button className="bevel-out px-3 py-1 text-sm" onClick={nudge} title="Send a nudge">
            Nudge!
          </button>
        </div>
      </div>
    </div>
  );
}
