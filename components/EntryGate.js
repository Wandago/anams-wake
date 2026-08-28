"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "anams-wake-entered";

// Original text — an invented "offering" ritual, not drawn from any
// existing riddle or folklore source. Every choice is accepted; this is
// a promo site's entrance ritual, not a puzzle that should turn visitors
// away.
const OFFERINGS = [
  {
    label: "A memory",
    response:
      "Memory keeps the dead close. Death has heard this offer before — and taken it before.",
  },
  {
    label: "A promise",
    response:
      "A promise binds the living. Death is patient. It will collect, in its own time.",
  },
  {
    label: "A name",
    response:
      "To speak a name aloud is to keep it living a little longer. Death allows this — for now.",
  },
  {
    label: "Silence",
    response: "Some griefs have no words. Death understands silence best of all.",
  },
];

export default function EntryGate() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState("intro"); // intro | riddle | leaving
  const [choice, setChoice] = useState(null);
  const audioCtxRef = useRef(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let seen = null;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable (privacy mode, etc.) — just show the gate.
    }

    if (!seen) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playToll = () => {
    const ctx = ensureAudio();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 110;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.3, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, now + 3);

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);

    osc.connect(env);
    env.connect(ctx.destination);
    env.connect(delay);
    delay.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 3.2);
  };

  const playAccept = () => {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    [392, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const env = ctx.createGain();
      const start = now + i * 0.16;
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(0.15, start + 0.03);
      env.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.5);
    });
  };

  const finish = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    document.body.style.overflow = "";
    window.dispatchEvent(new Event("anams-wake:enter"));
    setVisible(false);
    audioCtxRef.current?.close?.();
  };

  const handleEnter = async () => {
    const ctx = ensureAudio();
    if (ctx.state === "suspended") await ctx.resume();
    playToll();
    setStage("riddle");
  };

  const handleChoice = (offering) => {
    setChoice(offering);
    playAccept();
    // Hold the response on screen long enough to actually read it (the
    // longest is ~20 words) before the gate fades away. The +1100 matches
    // the "leaving" fade duration below so finish() fires as it lands.
    const readMs = reducedMotionRef.current ? 4200 : 5200;
    setTimeout(() => setStage("leaving"), readMs);
    setTimeout(finish, readMs + 1100);
  };

  const handleSkip = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    document.body.style.overflow = "";
    setVisible(false);
    audioCtxRef.current?.close?.();
  };

  if (!visible) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Enter Anam's Wake"
      initial={{ opacity: 0 }}
      animate={{ opacity: stage === "leaving" ? 0 : 1 }}
      transition={{ duration: stage === "leaving" ? 1.1 : 0.6 }}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-void-950 px-6"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={
            reducedMotionRef.current ? {} : { opacity: [0.35, 0.9, 0.35] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="h-1.5 w-1.5 rounded-full bg-ember-400 blur-[1px]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(138,35,49,0.12),transparent_65%)]" />

      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex max-w-md flex-col items-center text-center"
          >
            <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
              Anam&rsquo;s Wake
            </span>
            <p className="mt-4 font-display text-2xl italic text-bone-200">
              &ldquo;Death isn&rsquo;t the end, it&rsquo;s a negotiation.&rdquo;
            </p>
            <button
              type="button"
              onClick={handleEnter}
              className="mt-10 rounded-full border border-bone-100/30 px-8 py-3 text-xs uppercase tracking-widest2 text-bone-100 transition hover:border-ember-500/60 hover:text-ember-400"
            >
              Enter the Wake
            </button>
          </motion.div>
        )}

        {stage !== "intro" && !choice && (
          <motion.div
            key="riddle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex w-full max-w-lg flex-col items-center text-center"
          >
            <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
              Before You Enter
            </span>
            <p className="mt-4 font-display text-xl leading-snug text-bone-100 sm:text-2xl">
              Death asks its price. What do you bring to a negotiation you
              cannot win?
            </p>
            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              {OFFERINGS.map((offering) => (
                <button
                  key={offering.label}
                  type="button"
                  onClick={() => handleChoice(offering)}
                  className="rounded-lg border border-bone-500/20 px-3 py-3 text-xs uppercase tracking-wide text-bone-300 transition hover:border-ember-500/50 hover:text-ember-400"
                >
                  {offering.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {choice && (
          <motion.div
            key="response"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 max-w-md text-center"
          >
            <p className="font-display text-xl italic text-ember-400">
              {choice.response}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-6 right-6 z-10 text-[10px] uppercase tracking-widest2 text-bone-500 transition hover:text-bone-300"
      >
        Skip
      </button>
    </motion.div>
  );
}
