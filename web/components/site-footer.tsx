import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl border-t border-border px-5 py-10 text-sm text-muted-foreground">
      <p className="mb-2 font-mono text-xs tracking-[0.3em] text-border">── ✦ ──</p>
      <p className="max-w-3xl">
        One-shot tests, identical conditions, frozen prompts. Verdicts: the People&apos;s Vote and a
        cross-vendor AI judge panel; human scores through 2026-07-16 stand as history.{' '}
        <Link href="/tests/" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
          The protocol
        </Link>{' '}
        is public.
      </p>
      <p className="mt-2">
        Every run happens inside{' '}
        <a href="https://heybeckon.ai" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
          Beckon
        </a>
        . Say the word. Your agents build.
      </p>
      <p className="mt-4 text-xs">
        <a href="https://discord.gg/5C8Gwj3MVa" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          Join Discord
        </a>
      </p>
    </footer>
  );
}
