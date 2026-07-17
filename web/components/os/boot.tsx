'use client';

// Boot screen — once per browser session, skippable with a click.
import { useEffect, useState } from 'react';

const LINES = [
  ['BeckonBIOS v1.0 — The Vibe Coder’s Benchmark', 0],
  ['Memory test: 640K OK (should be enough for anybody)', 300],
  ['Detecting models .......... 4 found', 650],
  ['Loading BENCH.SYS ........ OK', 950],
  ['Loading RECEIPTS.DAT ..... OK', 1150],
  ['Mounting C:\\ARENA ........ OK', 1350],
  ['Starting Bench OS', 1600],
] as const;

export function BootScreen() {
  const [state, setState] = useState<'off' | 'booting' | 'done'>('off');
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem('benchos-booted')) return;
    sessionStorage.setItem('benchos-booted', '1');
    setState('booting');
    const timers = LINES.map(([, at], i) => setTimeout(() => setShown(i + 1), at as number));
    timers.push(setTimeout(() => setState('done'), 2300));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (state === 'off') return null;
  return (
    <div className={`boot ${state === 'done' ? 'done' : ''}`} onClick={() => setState('done')}>
      {LINES.slice(0, shown).map(([text], i) => (
        <p key={i}>
          {/OK$/.test(String(text)) ? (
            <>
              {String(text).replace(/OK$/, '')}
              <span className="ok">OK</span>
            </>
          ) : (
            String(text)
          )}
        </p>
      ))}
      {shown >= LINES.length && <p className="ok">▓▓▓▓▓▓▓▓░░</p>}
    </div>
  );
}
