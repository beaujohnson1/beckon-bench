'use client';

// Bench OS — the PostHog desktop metaphor in a Windows 95 skin.
// Desktop wallpaper, icon rails, one main window per route (title bar follows
// the route), and a taskbar with a Start button and live clock. Phase 1 shell:
// pages render unchanged inside the window.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PixelIcon } from './icons';
import { useDrag } from './use-drag';
import { BootScreen } from './boot';

const LEFT_RAIL = [
  { href: '/', icon: 'leaderboard', label: 'Leaderboard' },
  { href: '/vote/', icon: 'vote', label: 'Vote' },
  { href: '/matches/', icon: 'arena', label: 'Arena' },
  { href: '/tests/', icon: 'tests', label: 'The 8 Tests' },
] as const;

const RIGHT_RAIL = [
  { href: 'https://discord.gg/5C8Gwj3MVa', icon: 'discord', label: 'Discord', external: true },
  { href: 'https://heybeckon.ai', icon: 'beckon', label: 'Try Beckon', external: true },
  { href: '/tests/', icon: 'bin', label: 'Recycle Bin' },
] as const;

function windowTitle(path: string): string {
  if (path.startsWith('/vote')) return 'Voting Booth';
  if (path.startsWith('/matches')) return 'Arena — Models Judging Models';
  if (path.startsWith('/tests')) return 'The 8 Tests';
  if (path.startsWith('/model/')) return 'Model Properties';
  if (path.startsWith('/test/')) return 'Test Result';
  return 'Beckon Bench — Live Results';
}

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{now ?? '--:--'}</span>;
}

function DesktopIcon({ href, icon, label, active = false, external = false }: {
  href: string; icon: string; label: string; active?: boolean; external?: boolean;
}) {
  const inner = (
    <span className={`os-icon flex w-20 flex-col items-center gap-1 py-1 ${active ? 'active' : ''}`}>
      <PixelIcon name={icon} />
      <span className={`os-icon-label px-1 ${active ? 'bg-primary' : ''}`}>{label}</span>
    </span>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link href={href}>{inner}</Link>
  );
}

export function BenchOS({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href.replace(/\/$/, '')));
  const title = windowTitle(path);
  const { pos, reset, handlers } = useDrag();
  // 'open' | 'min' (taskbar button restores) | 'closed' (desktop only —
  // clicking any icon brings the window back)
  const [win, setWin] = useState<'open' | 'min' | 'closed'>('open');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset(); setWin('open'); }, [path]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-desktop">
      <BootScreen />
      <div className="flex min-h-0 flex-1 gap-2 p-3 sm:gap-4">
        {/* left rail */}
        <nav className="hidden shrink-0 flex-col gap-3 pt-2 sm:flex" onClickCapture={() => setWin('open')}>
          {LEFT_RAIL.map((it) => (
            <DesktopIcon key={it.label} {...it} active={isActive(it.href)} />
          ))}
        </nav>

        {/* the window — draggable by its title bar, double-click to snap back.
            Hidden (not unmounted) when minimized/closed so scroll and vote
            state survive a trip to the taskbar. */}
        <div
          className={`bevel-out min-h-0 min-w-0 flex-1 flex-col bg-background p-1 ${win === 'open' ? 'flex' : 'hidden'}`}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        >
          <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-1" {...handlers}>
            <PixelIcon name="beckon" size={16} />
            <span className="text-sm font-bold tracking-wide">{title}</span>
            <span className="ml-auto flex gap-0.5">
              <button className="os-titlebar-btn" title="Minimize" onClick={() => setWin('min')}>_</button>
              <span className="os-titlebar-btn" aria-hidden>□</span>
              <button className="os-titlebar-btn" title="Close" onClick={() => setWin('closed')}>✕</button>
            </span>
          </div>
          {/* mobile nav strip (rails hide on small screens) */}
          <div className="flex gap-1 border-b border-border bg-background px-1 py-1 text-xs sm:hidden">
            {LEFT_RAIL.map((it) => (
              <Link key={it.href} href={it.href} className={`px-2 py-0.5 ${isActive(it.href) ? 'bg-primary text-primary-foreground' : ''}`}>
                {it.label}
              </Link>
            ))}
          </div>
          <div className="bevel-field mx-1 mb-1 mt-1 min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>

        {/* keeps the rails at the screen edges while the window is away */}
        {win !== 'open' && <div className="min-w-0 flex-1" />}

        {/* right rail */}
        <nav className="hidden shrink-0 flex-col gap-3 pt-2 lg:flex" onClickCapture={() => setWin('open')}>
          {RIGHT_RAIL.map((it) => (
            <DesktopIcon key={it.label} {...it} active={false} external={'external' in it && it.external} />
          ))}
        </nav>
      </div>

      {/* taskbar */}
      <div className="bevel-out relative z-10 flex shrink-0 items-center gap-2 bg-background px-1 py-1">
        <a href="https://heybeckon.ai" className="bevel-out flex items-center gap-1.5 px-2 py-0.5 text-sm font-bold active:bevel-in">
          <PixelIcon name="beckon" size={16} />
          beckon
        </a>
        {win !== 'closed' && (
          <button
            onClick={() => setWin(win === 'open' ? 'min' : 'open')}
            className={`flex items-center gap-1.5 px-2 py-0.5 text-sm ${win === 'open' ? 'bevel-in bg-muted font-bold' : 'bevel-out bg-background'}`}
            title={win === 'open' ? 'Minimize' : 'Restore'}
          >
            <PixelIcon name="leaderboard" size={14} />
            <span className="max-w-40 truncate sm:max-w-none">{title}</span>
          </button>
        )}
        <span className="bevel-in ml-auto flex items-center gap-2 px-3 py-0.5 text-sm">
          <Clock />
        </span>
      </div>
    </div>
  );
}
