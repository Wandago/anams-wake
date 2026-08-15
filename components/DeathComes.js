"use client";

import Image from "next/image";
import { motion } from "motion/react";

const BEATS = [
  {
    image: "/still-2.jpg",
    glow: "rgba(224,180,102,0.14)",
    kicker: "The Custom",
    line: "Death can be summoned — to negotiate for the dead.",
  },
  {
    image: "/still-4.jpg",
    glow: "rgba(163,129,47,0.16)",
    kicker: "The Guide",
    line: "A young mourner is sent to lead a wealthy family through the wake.",
  },
  {
    image: "/still-6.jpg",
    glow: "rgba(138,35,49,0.3)",
    kicker: "The Reveal",
    line: "But Death has come for more than their patriarch.",
    emphasis: true,
  },
];

export default function DeathComes() {
  return (
    <section id="story" className="relative bg-void-900">
      {BEATS.map((beat, i) => (
        <div
          key={beat.kicker}
          className="relative flex min-h-screen snap-start snap-always items-center justify-center overflow-hidden px-6"
        >
          <Image
            src={beat.image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${beat.glow}, transparent 65%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-void-900/55"
          />
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative z-10 mx-auto max-w-3xl text-center"
          >
            <span className="mb-5 block text-[11px] uppercase tracking-widest2 text-ember-500">
              {String(i + 1).padStart(2, "0")} &mdash; {beat.kicker}
            </span>
            <p
              className={`font-display text-3xl font-light leading-snug text-shadow-glow sm:text-4xl md:text-5xl ${
                beat.emphasis ? "text-wake-500" : "text-bone-100"
              }`}
            >
              {beat.line}
            </p>
          </motion.div>
        </div>
      ))}
    </section>
  );
}
