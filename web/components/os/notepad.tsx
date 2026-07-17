'use client';

// Notepad — receipts open as .txt files, like it's 1995. A draggable overlay
// window with the classic inert menubar. NotepadButton is the file-styled
// launcher pages embed next to prompts and score records.
import { useEffect, useState } from 'react';
import { useDrag } from './use-drag';
import { PixelIcon } from './icons';

export function NotepadButton({ file, content, label }: { file: string; content: string; label?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-transparent px-2 py-1 font-mono text-xs hover:border-border hover:bg-muted"
        title={`Open ${file}`}
      >
        <PixelIcon name="tests" size={20} />
        <span className="underline decoration-dotted underline-offset-2">{label ?? file}</span>
      </button>
      {open && <Notepad file={file} content={content} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Notepad({ file, content, onClose }: { file: string; content: string; onClose: () => void }) {
  const { pos, handlers } = useDrag();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={onClose}>
      <div
        className="bevel-out flex max-h-[85vh] w-full max-w-2xl flex-col bg-background p-1"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="os-titlebar flex cursor-default items-center gap-2 px-2 py-1" {...handlers}>
          <PixelIcon name="tests" size={16} />
          <span className="text-sm font-bold tracking-wide">{file} - Notepad</span>
          <span className="ml-auto flex gap-0.5">
            <button className="os-titlebar-btn" onClick={onClose} title="Close">✕</button>
          </span>
        </div>
        <div className="menubar select-none text-foreground">
          <span>File</span><span>Edit</span><span>Search</span><span>Help</span>
        </div>
        <div className="bevel-field m-0.5 min-h-0 flex-1 overflow-auto">
          <pre className="whitespace-pre-wrap p-3 font-mono text-xs leading-relaxed">{content}</pre>
        </div>
      </div>
    </div>
  );
}
