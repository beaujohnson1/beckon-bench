import Link from 'next/link';

// 404 as a Win95 error dialog. Obviously.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="bevel-out w-full max-w-md bg-background p-1">
        <div className="os-titlebar flex items-center gap-2 px-2 py-1">
          <span className="text-sm font-bold tracking-wide">Beckon Bench</span>
          <span className="ml-auto"><span className="os-titlebar-btn" aria-hidden>✕</span></span>
        </div>
        <div className="flex items-start gap-4 p-5">
          <svg width="36" height="36" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
            <rect x="1" y="1" width="14" height="14" fill="#c0281e" />
            <rect x="4" y="4" width="2" height="2" fill="#fff" /><rect x="10" y="4" width="2" height="2" fill="#fff" />
            <rect x="6" y="6" width="2" height="2" fill="#fff" /><rect x="8" y="8" width="0" height="0" fill="#fff" />
            <rect x="7" y="7" width="2" height="2" fill="#fff" />
            <rect x="5" y="9" width="2" height="2" fill="#fff" /><rect x="9" y="9" width="2" height="2" fill="#fff" />
            <rect x="4" y="10" width="2" height="2" fill="#fff" /><rect x="10" y="10" width="2" height="2" fill="#fff" />
          </svg>
          <div className="text-sm">
            <p className="font-bold">This page could not be found. (404)</p>
            <p className="mt-1.5 text-muted-foreground">
              Every prompt, artifact, and vote on this bench is public — but this URL isn&apos;t one of them.
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-2 pb-4">
          <Link href="/" className="bevel-out bg-background px-10 py-1 text-center text-sm font-bold">OK</Link>
          <Link href="/vote/" className="bevel-out bg-background px-4 py-1 text-center text-sm">Go vote instead</Link>
        </div>
      </div>
    </div>
  );
}
