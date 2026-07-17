'use client';

// Bench OS — the PostHog desktop metaphor in a Windows 95 skin.
// Desktop wallpaper, icon rails, one main window per route (title bar follows
// the route), and a taskbar with a Start button and live clock. Phase 1 shell:
// pages render unchanged inside the window.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PixelIcon } from './icons';
import { useDrag } from './use-drag';
import { BootScreen } from './boot';
import { StartMenu, type MenuData } from './start-menu';
import { BenchAmp } from './benchamp';
import { Messenger } from './messenger';
import { BSOD, type Crash } from './bsod';

const LEFT_RAIL = [
  { href: '/', icon: 'leaderboard', label: 'Leaderboard' },
  { href: '/vote/', icon: 'vote', label: 'Vote' },
  { href: '/matches/', icon: 'arena', label: 'Arena' },
  { href: '/tests/', icon: 'tests', label: 'The 8 Tests' },
  { href: '/blog/', icon: 'news', label: 'Gazette' },
] as const;

const RIGHT_RAIL = [
  { href: 'https://discord.gg/5C8Gwj3MVa', icon: 'discord', label: 'Discord', external: true },
  { href: 'https://heybeckon.ai', icon: 'beckon', label: 'Try Beckon', external: true },
] as const;

function windowTitle(path: string): string {
  if (path.startsWith('/faq')) return 'Help — How the Bench Works';
  if (path.startsWith('/blog')) return 'Bench Gazette';
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

function DesktopIcon({ href, icon, img, label, active = false, external = false, onClick }: {
  href?: string; icon?: string; img?: string; label: string; active?: boolean; external?: boolean; onClick?: () => void;
}) {
  const inner = (
    <span className={`os-icon flex w-20 flex-col items-center gap-1 py-1 ${active ? 'active' : ''}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="h-10 w-10 object-contain [image-rendering:pixelated]" />
      ) : (
        <PixelIcon name={icon!} />
      )}
      <span className={`os-icon-label px-1 ${active ? 'bg-primary' : ''}`}>{label}</span>
    </span>
  );
  if (onClick) return <button onClick={onClick}>{inner}</button>;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link href={href!}>{inner}</Link>
  );
}

export function BenchOS({ children, menu }: { children: React.ReactNode; menu: MenuData }) {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href.replace(/\/$/, '')));
  const title = windowTitle(path);
  const { pos, reset, handlers } = useDrag();
  // 'open' | 'min' (taskbar button restores) | 'closed' (desktop only —
  // clicking any icon brings the window back)
  const [win, setWin] = useState<'open' | 'min' | 'closed'>('open');
  // null = maximized (fluid, fills the desktop). A size means the user grabbed
  // the corner grip; □ restores fluid.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const grip = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const onGripDown = (e: React.PointerEvent) => {
    const r = winRef.current!.getBoundingClientRect();
    grip.current = { px: e.clientX, py: e.clientY, w: r.width, h: r.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onGripMove = (e: React.PointerEvent) => {
    if (!grip.current) return;
    const clamp = (lo: number, v: number, hi: number) => Math.max(lo, Math.min(hi, v));
    setSize({
      w: clamp(420, grip.current.w + e.clientX - grip.current.px, window.innerWidth - 60),
      h: clamp(300, grip.current.h + e.clientY - grip.current.py, window.innerHeight - 70),
    });
  };
  const onGripUp = () => { grip.current = null; };
  const [start, setStart] = useState(false);
  const [amp, setAmp] = useState<'closed' | 'open' | 'min'>('closed');
  const [msn, setMsn] = useState<'closed' | 'open' | 'min'>('closed');
  const [bsod, setBsod] = useState<Crash | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset(); setWin('open'); setStart(false); }, [path]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-desktop">
      <BootScreen />
      {/* Beckon — the mascot. Lives on the desktop, bottom right, behind the
          window: close, minimize, or drag the window and there he is. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/beckon-mascot.png"
        alt="Beckon, the Bench OS mascot"
        className="pointer-events-none fixed bottom-12 right-8 z-0 hidden w-52 select-none lg:block"
      />
      <div className="flex min-h-0 flex-1 gap-2 p-3 sm:gap-4">
        {/* left rail */}
        <nav className="relative z-[1] hidden shrink-0 flex-col gap-3 pt-2 sm:flex" onClickCapture={() => setWin('open')}>
          {LEFT_RAIL.map((it) => (
            <DesktopIcon key={it.label} {...it} active={isActive(it.href)} />
          ))}
        </nav>

        {/* the window — draggable by its title bar (double-click snaps back),
            resizable by the corner grip, □ maximizes. z-[2] keeps it above the
            desktop icons while dragging, as an OS demands. Hidden (not
            unmounted) when minimized/closed so scroll and vote state survive
            a trip to the taskbar. */}
        <div
          ref={winRef}
          className={`bevel-out relative z-[2] min-h-0 min-w-0 flex-col bg-background p-1 ${win === 'open' ? 'flex' : 'hidden'} ${size ? '' : 'flex-1'}`}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            ...(size ? { width: size.w, height: size.h, flex: 'none' } : {}),
          }}
        >
          <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-1" {...handlers}>
            <PixelIcon name="beckon" size={16} />
            <span className="text-sm font-bold tracking-wide">{title}</span>
            <span className="ml-auto flex gap-0.5">
              <button className="os-titlebar-btn" title="Minimize" onClick={() => setWin('min')}>_</button>
              <button className="os-titlebar-btn" title="Maximize" onClick={() => { setSize(null); reset(); }}>□</button>
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
          {/* the corner grip — classic diagonal ridges */}
          <div
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            className="absolute bottom-1 right-1 z-[3] h-4 w-4 cursor-nwse-resize"
            style={{
              touchAction: 'none',
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent 0 3px, #808080 3px 4px, #fff 4px 5px)',
            }}
            title="Resize"
          />
        </div>

        {/* keeps the rails at the screen edges while the window is away or resized */}
        {(win !== 'open' || size) && <div className="min-w-0 flex-1" />}

        {/* right rail */}
        <nav className="relative z-[1] hidden shrink-0 flex-col gap-3 pt-2 lg:flex">
          {RIGHT_RAIL.map((it) => (
            <DesktopIcon key={it.label} {...it} active={false} external={'external' in it && it.external} />
          ))}
          <DesktopIcon icon="amp" label="BenchAmp" onClick={() => setAmp('open')} />
          <DesktopIcon icon="msn" label="Messenger" onClick={() => setMsn('open')} />
          <DesktopIcon img="/bonsai-buddy.png" label="Bonsai Buddy" onClick={() => setBsod('bonsai')} />
          <DesktopIcon icon="bin" label="Recycle Bin" onClick={() => setBsod('bin')} />
        </nav>
      </div>

      {/* taskbar */}
      <div className="bevel-out relative z-10 flex shrink-0 items-center gap-2 bg-background px-1 py-1">
        {start && <StartMenu data={menu} onClose={() => setStart(false)} />}
        <button
          onClick={() => setStart((s) => !s)}
          className={`flex items-center gap-1.5 px-2 py-0.5 text-sm font-bold ${start ? 'bevel-in bg-muted' : 'bevel-out'}`}
        >
          <PixelIcon name="beckon" size={16} />
          Start
        </button>
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
        {amp !== 'closed' && (
          <button
            onClick={() => setAmp(amp === 'open' ? 'min' : 'open')}
            className={`flex items-center gap-1.5 px-2 py-0.5 font-mono text-sm ${amp === 'open' ? 'bevel-in bg-muted font-bold' : 'bevel-out bg-background'}`}
            title={amp === 'open' ? 'Minimize BenchAmp' : 'Restore BenchAmp'}
          >
            <PixelIcon name="amp" size={14} />
            <span className="hidden sm:inline">BenchAmp</span>
          </button>
        )}
        {msn !== 'closed' && (
          <button
            onClick={() => setMsn(msn === 'open' ? 'min' : 'open')}
            className={`flex items-center gap-1.5 px-2 py-0.5 font-mono text-sm ${msn === 'open' ? 'bevel-in bg-muted font-bold' : 'bevel-out bg-background'}`}
            title={msn === 'open' ? 'Minimize Messenger' : 'Restore Messenger'}
          >
            <PixelIcon name="msn" size={14} />
            <span className="hidden sm:inline">Messenger</span>
          </button>
        )}
        <span className="bevel-in ml-auto flex items-center gap-2 px-3 py-0.5 text-sm">
          <Clock />
        </span>
      </div>
      {amp !== 'closed' && (
        <BenchAmp state={amp} onMin={() => setAmp('min')} onClose={() => setAmp('closed')} />
      )}
      {msn !== 'closed' && (
        <Messenger state={msn} stats={menu.stats} onMin={() => setMsn('min')} onClose={() => setMsn('closed')} />
      )}
      {bsod && <BSOD crash={bsod} onWake={() => setBsod(null)} />}
    </div>
  );
}
