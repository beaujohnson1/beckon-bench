import Link from 'next/link';

const NAV = [
  ['/', 'Leaderboard'],
  ['/vote/', 'Vote'],
  ['/matches/', 'Arena'],
  ['/tests/', 'Tests'],
] as const;

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-mono text-base font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-hand.png" alt="" className="h-6 w-auto" />
          Beckon<span className="text-primary">Bench</span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-xs font-semibold">
          {NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={
                label === active
                  ? 'text-primary shadow-[0_2px_0_var(--color-primary)]'
                  : 'text-muted transition-colors hover:text-foreground'
              }
            >
              {label}
            </Link>
          ))}
          <a
            href="https://discord.gg/5C8Gwj3MVa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
          >
            Discord
          </a>
          <a
            href="https://heybeckon.ai"
            className="rounded-lg bg-primary px-3.5 py-1.5 font-bold text-[#04140b] shadow-[0_0_18px_rgba(34,242,132,0.3)] transition-transform hover:-translate-y-px hover:bg-primary-deep"
          >
            Try Beckon
          </a>
        </nav>
      </div>
    </header>
  );
}
