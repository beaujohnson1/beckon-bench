import type { Model, Test, Run } from '@/lib/data';

// Embed the run's raw artifact: live sandboxed HTML, SVG/PNG image, or video.
// Assets are synced into public/a/<slug>/<test>/ by scripts/sync-assets.mjs.
export function Artifact({ m, t, run }: { m: Model; t: Test; run: Run }) {
  const base = `/a/${m.slug}/${t.id}`;
  const html = run.outputs.find((f) => f.endsWith('.html'));
  const svg = run.outputs.find((f) => f.endsWith('.svg'));
  const video = run.media.find((f) => /\.(mp4|webm|mov)$/i.test(f));
  const shot = run.media.find((f) => f.endsWith('.png'));
  const cls = 'block w-full rounded-lg border border-border bg-black';

  if (html)
    return (
      <div>
        <iframe className={`${cls} aspect-[16/10]`} sandbox="allow-scripts" loading="lazy" src={`${base}/output/${html}`} title={t.title} />
        <p className="mt-1.5 text-xs text-muted-foreground">Live artifact. Exactly what the model produced, sandboxed, no network.</p>
      </div>
    );
  if (svg) return <img className={`${cls} max-h-[34rem] object-contain`} loading="lazy" src={`${base}/output/${svg}`} alt={`${t.title} SVG artifact`} />;
  if (video) return <video className={cls} controls preload="none" src={`${base}/${video}`} />;
  if (shot) return <img className={`${cls} max-h-[34rem] object-contain`} loading="lazy" src={`${base}/${shot}`} alt={`${t.title} screenshot`} />;
  return null;
}
