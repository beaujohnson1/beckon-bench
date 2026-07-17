'use client';

// BenchAmp — an original Winamp-inspired player (the real skin is Llama
// Group's copyright; this is our own pixels). Plays original chiptune
// composed right here in WebAudio: square lead, triangle bass, noise hats.
// No samples, no rights, all vibes. Minimizes to the taskbar without
// stopping the music.
import { useEffect, useRef, useState } from 'react';
import { useDrag } from './use-drag';
import { PixelIcon } from './icons';

type Track = { name: string; bpm: number; bass: (number | null)[]; lead: (number | null)[]; hat: number[] };
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// three original loops (midi notes, 16 steps)
const TRACKS: Track[] = [
  {
    name: 'phosphor dreams.mod', bpm: 100,
    bass: [45, null, 45, null, 48, null, 45, null, 43, null, 43, null, 45, null, 52, null],
    lead: [69, null, 72, 76, null, 74, 72, null, 69, null, 67, null, 69, 72, null, null],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
  },
  {
    name: '56k anthem.mod', bpm: 132,
    bass: [40, 40, null, 40, 43, null, 40, null, 38, 38, null, 38, 45, null, 43, null],
    lead: [76, null, 79, null, 83, 81, 79, 76, null, 74, 76, null, 79, null, 76, null],
    hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  },
  {
    name: 'recycle bin blues.mod', bpm: 84,
    bass: [40, null, null, 43, null, 40, null, null, 45, null, null, 46, 45, null, 43, null],
    lead: [64, null, 67, null, 70, null, 67, 64, null, null, 62, 64, null, null, null, null],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
  },
];

class Engine {
  ctx: AudioContext; master: GainNode; analyser: AnalyserNode;
  timer: ReturnType<typeof setInterval> | null = null;
  nextBar = 0; track = TRACKS[0];
  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.master.connect(this.analyser).connect(this.ctx.destination);
  }
  note(type: OscillatorType, midi: number, t: number, dur: number, vol: number) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.value = hz(midi);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  hat(t: number) {
    const len = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = this.ctx.createGain(); g.gain.value = 0.25;
    s.connect(hp).connect(g).connect(this.master); s.start(t);
  }
  scheduleBar(t0: number) {
    const step = 60 / this.track.bpm / 2;
    this.track.bass.forEach((m, i) => m != null && this.note('triangle', m, t0 + i * step, step * 1.8, 0.5));
    this.track.lead.forEach((m, i) => m != null && this.note('square', m, t0 + i * step, step * 0.9, 0.18));
    this.track.hat.forEach((h, i) => h && this.hat(t0 + i * step));
    return 16 * step;
  }
  play(track: Track) {
    this.stopLoop();
    this.track = track;
    this.ctx.resume();
    this.nextBar = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => {
      while (this.nextBar < this.ctx.currentTime + 0.4) this.nextBar += this.scheduleBar(this.nextBar);
    }, 120);
  }
  stopLoop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  destroy() { this.stopLoop(); this.ctx.close(); }
}

export function BenchAmp({ state, onMin, onClose }: {
  state: 'open' | 'min'; onMin: () => void; onClose: () => void;
}) {
  const { pos, handlers } = useDrag();
  const engine = useRef<Engine | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.16);

  const ensure = () => (engine.current ??= new Engine());

  const play = (i = idx) => { ensure().play(TRACKS[i]); setPlaying(true); };
  const pause = () => { engine.current?.ctx.suspend(); setPlaying(false); };
  const resume = () => { engine.current ? (engine.current.ctx.resume(), setPlaying(true)) : play(); };
  const pick = (i: number) => { setIdx(i); play(i); };

  useEffect(() => () => engine.current?.destroy(), []);
  useEffect(() => { if (engine.current) engine.current.master.gain.value = vol; }, [vol]);

  // spectrum bars
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = canvas.current, en = engine.current;
      if (!cv) return;
      const c = cv.getContext('2d')!;
      c.fillStyle = '#040c06'; c.fillRect(0, 0, cv.width, cv.height);
      if (!en) return;
      const data = new Uint8Array(en.analyser.frequencyBinCount);
      en.analyser.getByteFrequencyData(data);
      const bars = 15, bw = cv.width / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i + 1] / 255;
        const h = Math.max(2, v * cv.height);
        c.fillStyle = '#22f284';
        c.fillRect(i * bw + 1, cv.height - h, bw - 2, h);
        c.fillStyle = '#0a5c34';
        c.fillRect(i * bw + 1, cv.height - h, bw - 2, 2);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`fixed bottom-16 left-6 z-[60] w-72 ${state === 'min' ? 'hidden' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="bevel-out bg-background p-1">
        <div className="os-titlebar flex cursor-default select-none items-center gap-2 px-2 py-0.5" {...handlers}>
          <span className="font-mono text-xs font-bold tracking-widest">BENCHAMP</span>
          <span className="ml-auto flex gap-0.5">
            <button className="os-titlebar-btn" onClick={onMin} title="Minimize">_</button>
            <button className="os-titlebar-btn" onClick={onClose} title="Close">✕</button>
          </span>
        </div>
        {/* display */}
        <div className="m-0.5 bg-[#040c06] p-2">
          <div className="overflow-hidden whitespace-nowrap font-mono text-[11px] text-[#22f284]">
            <span className="inline-block animate-[marquee_9s_linear_infinite]">
              ♪ {TRACKS[idx].name} — original chiptune · beckon bench · {TRACKS[idx].bpm} BPM &nbsp;&nbsp;&nbsp;
              ♪ {TRACKS[idx].name} — original chiptune · beckon bench · {TRACKS[idx].bpm} BPM
            </span>
          </div>
          <canvas ref={canvas} width={256} height={40} className="mt-1 w-full" />
        </div>
        {/* controls */}
        <div className="flex items-center gap-1 px-1 py-1">
          <button className="bevel-out px-2 py-0.5 font-mono text-xs" onClick={() => pick((idx + TRACKS.length - 1) % TRACKS.length)}>⏮</button>
          {playing ? (
            <button className="bevel-out px-3 py-0.5 font-mono text-xs" onClick={pause}>❚❚</button>
          ) : (
            <button className="bevel-out px-3 py-0.5 font-mono text-xs" onClick={resume}>▶</button>
          )}
          <button className="bevel-out px-2 py-0.5 font-mono text-xs" onClick={() => pick((idx + 1) % TRACKS.length)}>⏭</button>
          <input
            type="range" min={0} max={0.35} step={0.01} value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="ml-2 w-full accent-[#22f284]"
            aria-label="Volume"
          />
        </div>
        {/* playlist */}
        <div className="bevel-field m-0.5">
          {TRACKS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => pick(i)}
              className={`block w-full px-2 py-0.5 text-left font-mono text-[11px] ${i === idx ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {i + 1}. {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
