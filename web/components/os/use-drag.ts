'use client';

import { useCallback, useRef, useState } from 'react';

// Title-bar dragging for OS windows. Returns a transform offset, a reset,
// and pointer handlers to spread onto the title bar.
export function useDrag() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // don't hijack clicks on title-bar buttons/links
    if ((e.target as HTMLElement).closest('a, button, .os-titlebar-btn')) return;
    start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    const max = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.6 };
    setPos({
      x: Math.max(-max.x, Math.min(max.x, start.current.x + dx)),
      y: Math.max(-40, Math.min(max.y, start.current.y + dy)),
    });
  }, []);

  const onPointerUp = useCallback(() => { start.current = null; }, []);
  const reset = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return {
    pos,
    reset,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onDoubleClick: reset, style: { touchAction: 'none' as const } },
  };
}
