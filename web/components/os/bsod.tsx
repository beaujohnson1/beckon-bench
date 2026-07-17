'use client';

// The Recycle Bin's dirty secret: it's empty, because receipts never get
// deleted. Explaining that warrants a fatal exception.
export function BSOD({ onWake }: { onWake: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] cursor-pointer bg-[#0000aa] p-8 font-mono text-sm leading-relaxed text-[#c0c0c0] sm:p-16"
      onClick={onWake}
    >
      <p className="mx-auto mb-6 w-fit bg-[#c0c0c0] px-3 font-bold text-[#0000aa]">BENCH OS</p>
      <div className="mx-auto max-w-2xl">
        <p>A fatal exception 0E has occurred at 0028:C0BE41CE in VXD RECYCLE(01) + 00000BEC.</p>
        <p className="mt-4">The Recycle Bin could not be opened because it is, and always will be, empty:</p>
        <p className="mt-2">every prompt, artifact, score, and ballot on this bench is public — nothing gets thrown away. Voided runs are disclosed in the rulings, not deleted.</p>
        <p className="mt-6">*  Press any key to return to the desktop.</p>
        <p>*  Press CTRL+ALT+DEL to cast your vote again. Just kidding — ballots are deduplicated.</p>
        <p className="mt-8 text-center">Press any key to continue <span className="animate-[blink_1.06s_steps(1)_infinite]">_</span></p>
      </div>
    </div>
  );
}
