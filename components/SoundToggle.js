"use client";

import { useEffect, useRef, useState } from "react";

// Ambient drone is synthesized in-browser (no licensed audio required):
// two detuned low oscillators for a funereal hum, plus filtered noise for
// an air/candle-flicker texture, both under a slow breathing LFO.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  const buildGraph = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 55 * 1.5;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.18;
    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(master);

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.03;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    osc1.start();
    osc2.start();
    noise.start();
    lfo.start();

    return { master, osc1, osc2, noise, lfo };
  };

  const toggle = async () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      nodesRef.current = buildGraph(ctx);
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    const next = !on;
    const target = next ? 0.5 : 0;
    nodesRef.current.master.gain.linearRampToValueAtTime(
      target,
      ctx.currentTime + 0.8
    );
    setOn(next);
  };

  useEffect(() => {
    return () => {
      ctxRef.current?.close?.();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
      className="group fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-bone-500/30 bg-void-900/70 text-bone-300 backdrop-blur transition hover:border-ember-500/60 hover:text-ember-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
    >
      {on ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a9 9 0 0 1 0 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path d="M16 9l5 5M21 9l-5 5" />
        </svg>
      )}
    </button>
  );
}
