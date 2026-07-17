'use client';

// The Start menu — Programs, Documents, Games (the models' actual test-01
// horror games!), a dial-up "Connect" with a synthesized modem handshake,
// and Shut Down. Flyouts on hover, classic sidebar, easter eggs included.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PixelIcon } from './icons';

export type MenuData = {
  games: { name: string; href: string }[];
  recent: { name: string; href: string }[];
};

// Original modem-handshake impression via WebAudio: dial tone, DTMF digits,
// answer tone, warble, noise burst. ~2.6s. No samples, no copyrights.
function playDialup(onDone: () => void) {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.14;
  master.connect(ctx.destination);
  const tone = (freqs: number[], t0: number, dur: number, gain = 1) => {
    freqs.forEach((f) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(gain / freqs.length, ctx.currentTime + t0);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t0 + dur);
      o.connect(g).connect(master);
      o.start(ctx.currentTime + t0);
      o.stop(ctx.currentTime + t0 + dur + 0.02);
    });
  };
  // dial tone, then seven DTMF-ish digits
  tone([350, 440], 0, 0.45);
  const dtmf = [[697, 1209], [770, 1336], [852, 1477], [697, 1336], [941, 1209], [770, 1477], [852, 1336]];
  dtmf.forEach((pair, i) => tone(pair, 0.55 + i * 0.11, 0.08));
  // answer tone + carrier warble
  tone([2100], 1.5, 0.35, 0.8);
  tone([980], 1.9, 0.12); tone([1180], 2.02, 0.12); tone([980], 2.14, 0.12); tone([1650], 2.26, 0.14);
  // noise burst (the screech)
  const len = Math.floor(ctx.sampleRate * 0.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
  const ng = ctx.createGain(); ng.gain.value = 0.5;
  src.connect(bp).connect(ng).connect(master);
  src.start(ctx.currentTime + 2.4);
  setTimeout(() => { ctx.close(); onDone(); }, 3000);
}

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState('Dialing beckonbench.com…');
  const done = useRef(false);
  useEffect(() => {
    playDialup(() => { done.current = true; });
    const t1 = setTimeout(() => setStatus('Verifying receipts…'), 1400);
    const t2 = setTimeout(() => setStatus('CONNECT 56000 bps — welcome to the bench.'), 2900);
    const t3 = setTimeout(onClose, 5200);
    return () => [t1, t2, t3].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bevel-out w-full max-w-sm bg-background p-1" onClick={(e) => e.stopPropagation()}>
        <div className="os-titlebar flex items-center gap-2 px-2 py-1">
          <span className="text-sm font-bold">Dial-Up Networking</span>
          <button className="os-titlebar-btn ml-auto" onClick={onClose}>✕</button>
        </div>
        <div className="flex items-center gap-3 p-4">
          <PixelIcon name="beckon" size={32} />
          <p className="font-mono text-sm">{status}</p>
        </div>
      </div>
    </div>
  );
}

function ShutDown({ onWake }: { onWake: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex cursor-pointer items-center justify-center bg-black" onClick={onWake}>
      <div className="px-6 text-center">
        <p className="font-mono text-2xl font-bold text-[#e8a33d] sm:text-3xl">
          It&apos;s now safe to turn off your benchmark.
        </p>
        <p className="mt-4 font-mono text-sm text-[#666]">(click anywhere to keep benching)</p>
      </div>
    </div>
  );
}

function Item({ icon, children, onClick, flyout }: {
  icon: string; children: React.ReactNode; onClick?: () => void; flyout?: React.ReactNode;
}) {
  return (
    <li className="group relative">
      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-primary hover:text-primary-foreground"
        onClick={onClick}
      >
        <PixelIcon name={icon} size={22} />
        <span className="flex-1">{children}</span>
        {flyout && <span aria-hidden>▸</span>}
      </button>
      {flyout && (
        <div className="bevel-out invisible absolute left-full top-0 z-10 w-56 bg-background p-1 group-hover:visible">
          {flyout}
        </div>
      )}
    </li>
  );
}

function Fly({ items, onNavigate }: { items: { name: string; href: string; external?: boolean }[]; onNavigate: () => void }) {
  return (
    <ul>
      {items.map((it) =>
        it.external || it.href.startsWith('/a/') ? (
          <li key={it.href}>
            <a
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground"
              onClick={onNavigate}
            >
              {it.name}
            </a>
          </li>
        ) : (
          <li key={it.href}>
            <Link
              href={it.href}
              className="block px-3 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground"
              onClick={onNavigate}
            >
              {it.name}
            </Link>
          </li>
        )
      )}
    </ul>
  );
}

export function StartMenu({ data, onClose }: { data: MenuData; onClose: () => void }) {
  const [connect, setConnect] = useState(false);
  const [off, setOff] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const PROGRAMS = [
    { name: 'Leaderboard', href: '/' },
    { name: 'Voting Booth', href: '/vote/' },
    { name: 'Arena', href: '/matches/' },
    { name: 'The 8 Tests', href: '/tests/' },
  ];

  return (
    <>
      <div ref={ref} className="bevel-out absolute bottom-full left-1 z-[80] mb-0.5 flex w-64 bg-background p-1">
        <div className="os-titlebar flex w-7 items-end justify-center pb-2">
          <span className="font-mono text-xs font-bold tracking-widest text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Bench OS 95
          </span>
        </div>
        <ul className="min-w-0 flex-1 py-1">
          <Item icon="leaderboard" flyout={<Fly items={PROGRAMS} onNavigate={onClose} />}>Programs</Item>
          <Item icon="tests" flyout={<Fly items={data.recent} onNavigate={onClose} />}>Documents</Item>
          <Item icon="arena" flyout={
            <div>
              <p className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
                Test 01, playable — each model&apos;s actual artifact
              </p>
              <Fly items={data.games} onNavigate={onClose} />
            </div>
          }>Games</Item>
          <Item icon="discord" onClick={() => { window.open('https://discord.gg/5C8Gwj3MVa', '_blank', 'noopener'); onClose(); }}>Discord</Item>
          <Item icon="beckon" onClick={() => { window.open('https://heybeckon.ai', '_blank', 'noopener'); onClose(); }}>Try Beckon</Item>
          <li className="mx-2 my-1 border-t border-border shadow-[0_1px_0_#fff]" />
          <Item icon="vote" onClick={() => setConnect(true)}>Connect to the Internet</Item>
          <Item icon="bin" onClick={() => setOff(true)}>Shut Down…</Item>
        </ul>
      </div>
      {connect && <ConnectDialog onClose={() => { setConnect(false); onClose(); }} />}
      {off && <ShutDown onWake={() => { setOff(false); onClose(); }} />}
    </>
  );
}
