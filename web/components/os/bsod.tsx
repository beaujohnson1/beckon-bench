'use client';

// Fatal exceptions, as a feature. Two known crashes:
//  - bin: the Recycle Bin can't open because receipts never get deleted
//  - bonsai: you clicked Bonsai Buddy. You knew. You clicked anyway.
export type Crash = 'bin' | 'bonsai';

const CRASHES: Record<Crash, { at: string; lines: string[] }> = {
  bin: {
    at: 'A fatal exception 0E has occurred at 0028:C0BE41CE in VXD RECYCLE(01) + 00000BEC.',
    lines: [
      'The Recycle Bin could not be opened because it is, and always will be, empty:',
      'every prompt, artifact, score, and ballot on this bench is public — nothing gets thrown away. Voided runs are disclosed in the rulings, not deleted.',
      '*  Press any key to return to the desktop.',
      '*  Press CTRL+ALT+DEL to cast your vote again. Just kidding — ballots are deduplicated.',
    ],
  },
  bonsai: {
    at: 'A fatal exception B0 has occurred at 0028:B0N5A1BD in VXD BUDDY(95) + 0000FR13ND.',
    lines: [
      'BONSAI.EXE attempted to become your best friend without consent.',
      'It wanted to read your email aloud, tell you a fact about Antarctica, and install four toolbars. This behavior has been blocked since 1999.',
      'Your benchmark has been protected. Exactly one (1) purple animal was installed anyway. It is on the desktop. It is watching.',
      '*  Press any key to return to the desktop.',
      '*  Do not click Bonsai Buddy again. (You will click Bonsai Buddy again.)',
    ],
  },
};

export function BSOD({ crash, onWake }: { crash: Crash; onWake: () => void }) {
  const c = CRASHES[crash];
  return (
    <div
      className="fixed inset-0 z-[200] cursor-pointer bg-[#0000aa] p-8 font-mono text-sm leading-relaxed text-[#c0c0c0] sm:p-16"
      onClick={onWake}
    >
      <p className="mx-auto mb-6 w-fit bg-[#c0c0c0] px-3 font-bold text-[#0000aa]">BENCH OS</p>
      <div className="mx-auto max-w-2xl">
        <p>{c.at}</p>
        {c.lines.map((l, i) => (
          <p key={i} className={l.startsWith('*') ? 'mt-1' : 'mt-4'}>{l}</p>
        ))}
        <p className="mt-8 text-center">
          Press any key to continue <span className="animate-[blink_1.06s_steps(1)_infinite]">_</span>
        </p>
      </div>
    </div>
  );
}
