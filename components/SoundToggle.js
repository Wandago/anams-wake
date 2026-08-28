"use client";

import { useEffect, useRef, useState } from "react";

// Ambient bed is a field recording from the film itself
// (public/audio/chosen.m4a), looped. AAC/.m4a plays natively in Safari,
// iOS Safari, Chrome, Edge and Firefox.
const SRC = "/audio/chosen.m4a";
const VOLUME = 0.7;
const FADE_MS = 900;

export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const audioRef = useRef(null);
  const rafRef = useRef(0);

  const fadeTo = (target, ms = FADE_MS) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(rafRef.current);
    const from = audio.volume;
    const startedAt = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (target === 0) {
        audio.pause();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Kick the element into a playing state. Must be reachable synchronously
  // from a real user gesture the first time — the only way iOS Safari lets
  // audio start. `audible: false` starts it silently (blessed but inaudible)
  // so the entry ritual keeps its own soundscape; a later call fades it up.
  const startPlayback = async ({ audible }) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.muted = false;
      if (audio.paused) {
        audio.volume = 0;
        await audio.play();
      }
      if (audible) {
        fadeTo(VOLUME);
        setOn(true);
      }
    } catch {
      // Autoplay was refused — leave the toggle button as the way in.
      setOn(false);
    }
  };

  const stopPlayback = () => {
    fadeTo(0);
    setOn(false);
  };

  const toggle = () => {
    if (on) stopPlayback();
    else startPlayback({ audible: true });
  };

  useEffect(() => {
    // "unlock" fires from the gate tap itself — begin playing silently so
    // iOS blesses the element. "enter" fires when the ritual finishes (or
    // immediately on Skip) — that's when the film bed fades in.
    const handleUnlock = () => startPlayback({ audible: false });
    const handleEnter = () => startPlayback({ audible: true });
    window.addEventListener("anams-wake:unlock", handleUnlock);
    window.addEventListener("anams-wake:enter", handleEnter);
    return () => {
      window.removeEventListener("anams-wake:unlock", handleUnlock);
      window.removeEventListener("anams-wake:enter", handleEnter);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" playsInline />
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
    </>
  );
}
