"use client";

import { useEffect, useRef, useState } from "react";

// Everything here is synthesized in-browser — no licensed or downloaded
// audio. A dissonant, slowly drifting drone (root + flat second + tritone,
// the classic "wrong" intervals) under filtered wind noise, plus a sparse,
// randomly-timed funeral bell run through a feedback delay for a tolling
// tail. Fitting, given it's a wake.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const bellTimeoutRef = useRef(null);

  const buildGraph = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Dissonant drone: root, a flat second above, and a tritone above.
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.14;
    droneGain.connect(master);

    const ratios = [1, 1.06, 1.414];
    const oscs = ratios.map((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = 41.2 * ratio; // low E-ish root
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = i === 0 ? 1 : 0.55;
      osc.connect(voiceGain);
      voiceGain.connect(droneGain);

      // Slow, slightly random detune drift per voice for unease.
      const drift = ctx.createOscillator();
      drift.frequency.value = 0.03 + Math.random() * 0.05;
      const driftGain = ctx.createGain();
      driftGain.gain.value = 4 + Math.random() * 4;
      drift.connect(driftGain);
      driftGain.connect(osc.detune);
      drift.start();

      osc.start();
      return osc;
    });

    // Filtered noise "wind" with a slow breathing sweep on the filter.
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
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.035;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.05;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 260;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(noiseFilter.frequency);
    filterLfo.start();

    // Slow breathing on the overall drone level.
    const breathLfo = ctx.createOscillator();
    breathLfo.frequency.value = 0.07;
    const breathLfoGain = ctx.createGain();
    breathLfoGain.gain.value = 0.05;
    breathLfo.connect(breathLfoGain);
    breathLfoGain.connect(droneGain.gain);
    breathLfo.start();

    // Feedback delay for the bell's tolling tail.
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.value = 2200;
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);

    const bellBus = ctx.createGain();
    bellBus.gain.value = 0.5;
    bellBus.connect(master);
    bellBus.connect(delay);

    noise.start();

    return { master, oscs, noise, bellBus, panner: null };
  };

  const ringBell = (ctx, bellBus) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 220 + Math.random() * 30;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.22, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 0.8;

    osc.connect(env);
    env.connect(panner);
    panner.connect(bellBus);

    osc.start(now);
    osc.stop(now + 6);
  };

  const scheduleBell = () => {
    const delayMs = 14000 + Math.random() * 22000;
    bellTimeoutRef.current = setTimeout(() => {
      if (!ctxRef.current || !nodesRef.current) return;
      ringBell(ctxRef.current, nodesRef.current.bellBus);
      scheduleBell();
    }, delayMs);
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

    if (next) {
      ringBell(ctx, nodesRef.current.bellBus);
      scheduleBell();
    } else if (bellTimeoutRef.current) {
      clearTimeout(bellTimeoutRef.current);
      bellTimeoutRef.current = null;
    }

    setOn(next);
  };

  useEffect(() => {
    return () => {
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
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
